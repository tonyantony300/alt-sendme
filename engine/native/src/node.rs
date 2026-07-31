use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use anyhow::Context;
use iroh::endpoint::{
    presets, AfterHandshakeOutcome, Connection, Endpoint, EndpointHooks, RelayMode, Side,
};
use iroh::protocol::{AcceptError, ProtocolHandler, Router};
use iroh::address_lookup::pkarr::{PkarrPublisher, PkarrResolver};
use iroh::address_lookup::dns::DnsAddressLookup;
use iroh::EndpointId;
use protocol::{
    allows_unpaired_control, apply_options, export_connection_keying_material, read_message,
    should_answer_identity, should_publish_mdns, sign_challenge, unpaired_message_allowed,
    verify_challenge, write_message, AddrInfoOptions, AppHandle, ControlMessage, Discoverability,
    DiscoveryModeOption, InviteResponse, PairedDevice, PairingStatus, RememberVote, SendOptions,
    CONTROL_ALPN, PRESENCE_CONNECT_TIMEOUT_SECS,
};
use tokio::sync::{mpsc, Mutex, RwLock};
use tokio::task::JoinHandle;
use tracing::debug;

use crate::device_identity::{
    load_or_create_identity, DeviceIdentity, DeviceInfo, PairedDeviceInfo, PairedDeviceStore,
};
use crate::lan_discovery::{LanDiscovery, LanEvent};
use crate::nearby::{NearbyDevice, NearbyRegistry, ObserveOutcome};
use crate::paired_connections::{invite_wait_timeout, PairedConnectionManager};
use crate::pairing_util::{build_control_connect_addr, set_presence};
use crate::runtime::NodeRuntime;
use crate::send::start_share_items;
use crate::types::SendResult;

#[derive(Debug)]
pub(crate) struct AccessState {
    pub(crate) allowed: HashSet<EndpointId>,
    pub(crate) pairing_host_open: bool,
    pub(crate) discoverability: Discoverability,
}

#[derive(Debug)]
struct PairedOnlyHook {
    access: Arc<RwLock<AccessState>>,
    blocked: Arc<RwLock<HashSet<String>>>,
}

impl EndpointHooks for PairedOnlyHook {
    async fn after_handshake(&self, conn: &Connection) -> AfterHandshakeOutcome {
        if conn.side() != Side::Server {

            return AfterHandshakeOutcome::accept();
        }
        if conn.alpn() != CONTROL_ALPN {

            return AfterHandshakeOutcome::accept();
        }
        let remote = conn.remote_id();
        if self.blocked.read().await.contains(&remote.to_string()) {
            return AfterHandshakeOutcome::Reject {
                error_code: 403u32.into(),
                reason: b"blocked peer".to_vec(),
            };
        }
        let access = self.access.read().await;
        let allowed = access.allowed.contains(&remote);
        if access.pairing_host_open || allowed || allows_unpaired_control(access.discoverability) {

            return AfterHandshakeOutcome::accept();
        }

        AfterHandshakeOutcome::Reject {
            error_code: 403u32.into(),
            reason: b"unauthorized control peer".to_vec(),
        }
    }
}

#[derive(Clone)]
struct ControlCtx {
    identity: Arc<DeviceIdentity>,
    paired_store: Arc<PairedDeviceStore>,
    access: Arc<RwLock<AccessState>>,
    pairing_host_persistent: Arc<AtomicBool>,
    app_handle: AppHandle,
    /// Updated in the background once the endpoint reaches a home relay.
    home_relay_url: Arc<std::sync::RwLock<Option<String>>>,
    presence: Arc<std::sync::RwLock<HashMap<String, bool>>>,
    paired_connections: Arc<PairedConnectionManager>,
    /// Endpoint ids this node has sent a nearby invite to and not yet seen a
    /// response for, with just enough identity to record them as paired if
    /// that response is an accept. Consulted when an *unpaired* peer sends an
    /// `InviteResponse` — only acted on if it's in here, so an arbitrary
    /// unpaired stranger can't spoof an acceptance for an invite it never
    /// received. See `NodeService::invite_nearby_device` (adds) and
    /// `ControlProtocol::handle_paired_control_message` (consumes).
    pending_nearby_invites: Arc<RwLock<HashMap<String, PendingNearbyInvite>>>,
    /// Devices seen on the local network but not yet paired. Shared with
    /// `NodeService` so the sender's half of mutual nearby pairing
    /// (`ControlProtocol::commit_nearby_pairing`) can expire its own Nearby
    /// entry for a peer it just committed to pairing with, mirroring what
    /// `NodeService::accept_nearby_invite` does on the receiver's side.
    nearby: Arc<Mutex<NearbyRegistry>>,
}

/// Snapshot of a nearby peer's identity, captured when we invite them, kept
/// just long enough to record them as paired if they accept. Not the full
/// `NearbyDevice` — only what `PairedDevice` needs — because the Nearby
/// entry itself may have expired by the time the response arrives (the peer
/// stopped advertising, or already got promoted locally), and this is a
/// standalone fallback, not a live reference to it.
#[derive(Debug, Clone)]
struct PendingNearbyInvite {
    display_name: String,
    device_type: String,
    os: String,
}

#[derive(Clone)]
struct ControlProtocol {
    ctx: ControlCtx,
}

impl std::fmt::Debug for ControlProtocol {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ControlProtocol").finish_non_exhaustive()
    }
}

impl ControlProtocol {
    async fn handle_connection(&self, conn: Connection) -> anyhow::Result<()> {
        let remote = conn.remote_id();
        let pairing_host_open = self.ctx.access.read().await.pairing_host_open;
        let allowed = self.is_allowed(&remote).await;

        if allowed {

            return self.handle_control_session(conn, true).await;
        }

        if !pairing_host_open {
            // Not paired and no pairing window is open: the only way we got
            // this far is the handshake gate accepting us under
            // `Discoverability::Everyone`. Serve the reduced unpaired
            // message set (identity probes, unpaired invites).
            return self.handle_control_session(conn, false).await;
        }

        let keying = export_connection_keying_material(&conn).context("export keying material")?;

        let (mut send, mut recv) = match conn.accept_bi().await {
            Ok(streams) => {

                streams
            }
            Err(err) => {
                return Err(err).context("accept bi stream for control session");
            }
        };

        let our_info = ControlMessage::PairingInfo {
            endpoint_id: self.ctx.identity.endpoint_id(),
            display_name: self.ctx.identity.display_name(),
            device_type: self.ctx.identity.device_type(),
            os: self.ctx.identity.os(),
            signature: sign_challenge(&self.ctx.identity.secret_key, &keying),
        };
        write_message(&mut send, &our_info)
            .await
            .context("write local PairingInfo")?;

        let mut remote_info: Option<ControlMessage> = None;
        let mut remote_vote: Option<RememberVote> = None;
        let mut pairing_completed = false;
        let mut invite_received = false;
        let session_id = uuid::Uuid::new_v4().to_string();

        loop {
            let msg = match read_message(&mut recv).await {
                Ok(m) => m,
                Err(_err) => {
                    break;
                }
            };
            match msg {
                ControlMessage::PairingInfo {
                    endpoint_id,
                    display_name,
                    device_type,
                    os,
                    signature,
                } => {
                    let Ok(peer_id) = EndpointId::from_str(&endpoint_id) else {

                        continue;
                    };
                    if !verify_challenge(&peer_id, &keying, &signature) {

                        continue;
                    }

                    remote_info = Some(ControlMessage::PairingInfo {
                        endpoint_id,
                        display_name,
                        device_type,
                        os,
                        signature,
                    });
                }
                ControlMessage::RememberVote { vote, .. } => {
                    remote_vote = Some(vote);
                }
                ControlMessage::Invite {
                    blob_ticket,
                    file_count,
                    total_size,
                    sender_name,
                } => {
                    let allowed = self.is_allowed(&remote).await;


                    if !allowed {

                        continue;
                    }
                    invite_received = true;
                    let payload = serde_json::json!({
                        "blob_ticket": blob_ticket,
                        "file_count": file_count,
                        "total_size": total_size,
                        "sender_name": sender_name,
                        "remote_endpoint_id": remote.to_string(),
                    });
                    if let Some(handle) = &self.ctx.app_handle {
                        let _ = handle.emit_event_with_payload(
                            "paired-invite-received",
                            &payload.to_string(),
                        );
                    }
                }
                ControlMessage::InviteResponse { response, .. } => {
                    let response_str = match response {
                        InviteResponse::Accepted => "accepted",
                        InviteResponse::Declined => "declined",
                    };
                    debug!(?response, "invite response from {remote}");
                    crate::pairing_util::emit_paired_invite_response(
                        &self.ctx.app_handle,
                        &self.ctx.paired_store,
                        &remote.to_string(),
                        response_str,
                    );
                }
                ControlMessage::Recognition { signature } => {
                    if verify_challenge(&remote, &keying, &signature) {

                        let now = protocol::identity::unix_now_ms();
                        let _ = self.ctx.paired_store.touch(&remote.to_string(), now);
                        set_presence(
                            &self.ctx.presence,
                            &self.ctx.app_handle,
                            &self.ctx.paired_store,
                            &remote.to_string(),
                            true
                        );
                    }
                }
                ControlMessage::Forget { signature } => {
                    if verify_challenge(&remote, &keying, &signature) {

                        if let Ok(Some(device)) = self
                            .ctx
                            .paired_store
                            .mark_unpaired_remotely(&remote.to_string())
                        {
                            {
                                let mut access = self.ctx.access.write().await;
                                access.allowed.remove(&remote);
                            }
                            set_presence(
                                &self.ctx.presence,
                                &self.ctx.app_handle,
                                &self.ctx.paired_store,
                                &remote.to_string(),
                                false
                            );
                            let payload = serde_json::json!({
                                "endpoint_id": device.endpoint_id,
                                "display_name": device.display_name,
                                "reason": "remote",
                            });
                            if let Some(handle) = &self.ctx.app_handle {
                                let _ = handle.emit_event_with_payload(
                                    "device-unpaired",
                                    &payload.to_string(),
                                );
                            }
                        }
                    }
                }
                ControlMessage::WhoAreYou | ControlMessage::Identity { .. } => {
                    // Discovery messages; ignore on paired connections
                }
            }

            if remote_info.is_some() && remote_vote == Some(RememberVote::Remember) {

                if let Some(ControlMessage::PairingInfo {
                    endpoint_id,
                    display_name,
                    device_type,
                    os,
                    ..
                }) = &remote_info
                {
                    let now = protocol::identity::unix_now_ms();
                    let relay_url = self
                        .ctx
                        .home_relay_url
                        .read()
                        .expect("home_relay_url")
                        .clone();
                    let device = PairedDevice {
                        endpoint_id: endpoint_id.clone(),
                        display_name: display_name.clone(),
                        device_type: device_type.clone(),
                        os: os.clone(),
                        paired_at: now,
                        last_seen_at: now,
                        relay_url,
                        pairing_status: PairingStatus::Active,
                    };
                    let _ = self.ctx.paired_store.remember(device);
                    self.allow_peer(remote).await;
                    self.ctx.paired_connections.refresh().await;

                    if let Some(handle) = &self.ctx.app_handle {

                        let _ = handle.emit_event("device-paired");
                    }
                }
                pairing_completed = true;
                break;
            }
        }

        if remote_info.is_some() {

            let vote = ControlMessage::RememberVote {
                session_id,
                vote: RememberVote::Remember,
            };
            let _ = write_message(&mut send, &vote).await;
        }

        if pairing_completed {
            let persistent = self
                .ctx
                .pairing_host_persistent
                .load(Ordering::SeqCst);
            if !persistent {
                self.ctx.access.write().await.pairing_host_open = false;

            }
            // Hold the session until the joiner reads our messages and disconnects.
            drop(send);
            drop(recv);

            match tokio::time::timeout(Duration::from_secs(30), conn.closed()).await {
                Ok(_closed) => {},
                Err(_) => {
                    }
            }
        } else if invite_received {
            // Keep the session open until the sender finishes reading our side.
            drop(send);
            drop(recv);

            match tokio::time::timeout(Duration::from_secs(15), conn.closed()).await {
                Ok(_closed) => {},
                Err(_) => {
                    }
            }
        }

        Ok(())
    }

    /// Serves an accepted control connection's message loop. `peer_is_paired`
    /// distinguishes an established relationship (tracked in
    /// `paired_connections` for reuse) from a peer the handshake gate let
    /// through only because we're discoverable — an unpaired peer may probe
    /// our identity or send an unpaired invite, and nothing else.
    ///
    /// Registration with `paired_connections` is deliberately lazy: a paired
    /// peer can still open a short-lived, probe-only connection (e.g. our own
    /// `probe_identity`, dialed against someone we already know), and that
    /// must never clobber the session entry the peer's real persistent
    /// control connection occupies. Only a message that implies an ongoing
    /// relationship (anything but `WhoAreYou`) marks this connection as the
    /// one to register — and only that connection gets unregistered again.
    async fn handle_control_session(
        &self,
        conn: Connection,
        peer_is_paired: bool,
    ) -> anyhow::Result<()> {
        let remote = conn.remote_id();
        let endpoint_id = remote.to_string();
        let mut registered = false;

        let keying = export_connection_keying_material(&conn)
            .context("export keying material for control session")?;

        loop {
            let (mut send, mut recv) = match conn.accept_bi().await {
                Ok(streams) => {

                    streams
                }
                Err(_err) => {

                    break;
                }
            };

            let msg = match read_message(&mut recv).await {
                Ok(m) => m,
                Err(_err) => {

                    continue;
                }
            };

            // The handshake gate decided whether to accept the connection at
            // all; this decides what may travel across it. An unpaired peer
            // sending a relationship message is buggy or hostile either way.
            if !peer_is_paired && !unpaired_message_allowed(&msg) {
                conn.close(403u32.into(), b"not permitted for unpaired peer");
                break;
            }

            if let ControlMessage::WhoAreYou = msg {
                let setting = self.ctx.access.read().await.discoverability;
                if !should_answer_identity(setting, peer_is_paired) {
                    if !peer_is_paired {
                        conn.close(403u32.into(), b"not discoverable");
                        break;
                    }
                    // A paired peer's session must survive a refused probe —
                    // ignore it and keep serving this connection.
                    continue;
                }
                let info = DeviceInfo::from(self.ctx.identity.as_ref());
                let reply = ControlMessage::Identity {
                    endpoint_id: info.endpoint_id,
                    display_name: info.display_name,
                    device_type: info.device_type,
                    os: info.os,
                };
                if let Err(err) = write_message(&mut send, &reply).await {
                    tracing::debug!("identity reply failed: {err:#}");
                }
                continue;
            }

            if peer_is_paired && !registered {
                self.ctx
                    .paired_connections
                    .register_inbound(&endpoint_id, conn.clone())
                    .await;
                registered = true;
            }

            let unpaired_now = self
                .handle_paired_control_message(&remote, &keying, msg, peer_is_paired)
                .await;
            if unpaired_now {
                // Close so the sender's delivery wait resolves promptly.
                conn.close(0u32.into(), b"unpaired");
                break;
            }
        }

        if registered {
            self.ctx
                .paired_connections
                .unregister_inbound(&endpoint_id)
                .await;
        }

        Ok(())
    }

    /// Returns true when the peer unpaired us and the session should close.
    async fn handle_paired_control_message(
        &self,
        remote: &EndpointId,
        keying: &[u8],
        msg: ControlMessage,
        peer_is_paired: bool,
    ) -> bool {
        match msg {
            ControlMessage::Invite {
                blob_ticket,
                file_count,
                total_size,
                sender_name,
            } => {

                crate::pairing_util::emit_paired_invite_received(
                    &self.ctx.app_handle,
                    &remote.to_string(),
                    &blob_ticket,
                    file_count,
                    total_size,
                    &sender_name,
                );
            }
            ControlMessage::InviteResponse { response, .. } => {
                // A paired peer's response always corresponds to something we
                // sent (`invite_paired_device` requires the target to already
                // be in our allowlist). An unpaired peer has no such
                // guarantee — anyone could dial in and claim to be answering
                // an invite — so only act on it if it matches a nearby
                // invite this node actually sent.
                if !peer_is_paired {
                    let pending = self
                        .ctx
                        .pending_nearby_invites
                        .write()
                        .await
                        .remove(&remote.to_string());
                    let Some(pending) = pending else {
                        tracing::debug!(
                            "ignoring InviteResponse from unpaired {remote} with no outstanding nearby invite"
                        );
                        return false;
                    };
                    // Mirror what `accept_nearby_invite` does on the
                    // receiver's side: without this, the receiver's
                    // persistent presence connection back to us is rejected
                    // (their `Recognition` isn't allowed from a peer we still
                    // consider unpaired), so presence/reconnect never
                    // establishes in that direction. A decline stays
                    // toast-only — nothing to commit.
                    if matches!(response, InviteResponse::Accepted) {
                        self.commit_nearby_pairing(remote, pending).await;
                    }
                }

                let response_str = match response {
                    InviteResponse::Accepted => "accepted",
                    InviteResponse::Declined => "declined",
                };

                crate::pairing_util::emit_paired_invite_response(
                    &self.ctx.app_handle,
                    &self.ctx.paired_store,
                    &remote.to_string(),
                    response_str,
                );
            }
            ControlMessage::Recognition { signature } => {

                if verify_challenge(remote, keying, &signature) {

                    let now = protocol::identity::unix_now_ms();
                    let _ = self
                        .ctx
                        .paired_store
                        .touch(&remote.to_string(), now);
                    set_presence(
                        &self.ctx.presence,
                        &self.ctx.app_handle,
                        &self.ctx.paired_store,
                        &remote.to_string(),
                        true
                    );
                }
            }
            ControlMessage::Forget { signature } => {

                if verify_challenge(remote, keying, &signature) {

                    let marked = self
                        .ctx
                        .paired_store
                        .mark_unpaired_remotely(&remote.to_string());
                    if let Ok(Some(device)) = marked {
                        {
                            let mut access = self.ctx.access.write().await;
                            access.allowed.remove(remote);
                        }
                        set_presence(
                            &self.ctx.presence,
                            &self.ctx.app_handle,
                            &self.ctx.paired_store,
                            &remote.to_string(),
                            false
                        );
                        self.ctx.paired_connections.forget(&remote.to_string()).await;
                        let payload = serde_json::json!({
                            "endpoint_id": device.endpoint_id,
                            "display_name": device.display_name,
                            "reason": "remote",
                        });
                        if let Some(handle) = &self.ctx.app_handle {

                            let _ = handle.emit_event_with_payload(
                                "device-unpaired",
                                &payload.to_string(),
                            );
                        }
                    }
                    return true;
                }
            }
            _other => {

            }
        }
        false
    }

    /// Commits the sender's half of mutual nearby pairing: seeing our own
    /// invite accepted is the same kind of durable trust decision accepting
    /// one is, so it gets the same treatment `NodeService::accept_nearby_invite`
    /// gives the receiver — a `PairedDevice` record, an allowlist entry, a
    /// `paired_connections` refresh, and the `device-paired` event (reused,
    /// not a new one) so both platform UIs pick it up the same way.
    ///
    /// Without this, pairing stayed one-sided: the receiver trusted us, but
    /// we still saw them as an unpaired stranger, so their persistent
    /// presence connection back to us kept getting rejected (their
    /// `Recognition` isn't allowed from a peer we don't consider paired) and
    /// presence/reconnect never established in that direction.
    async fn commit_nearby_pairing(&self, remote: &EndpointId, pending: PendingNearbyInvite) {
        let endpoint_id = remote.to_string();
        let now = protocol::identity::unix_now_ms();
        if let Err(err) = self.ctx.paired_store.remember(PairedDevice {
            endpoint_id: endpoint_id.clone(),
            display_name: pending.display_name,
            device_type: pending.device_type,
            os: pending.os,
            paired_at: now,
            last_seen_at: now,
            relay_url: None,
            pairing_status: PairingStatus::default(),
        }) {
            tracing::debug!(
                "failed to remember nearby peer {remote} after mutual accept: {err:#}"
            );
            return;
        }

        // Mirrors `accept_nearby_invite`: a paired record must not also show
        // under Nearby.
        self.ctx.nearby.lock().await.expire(&endpoint_id);
        self.ctx.access.write().await.allowed.insert(*remote);
        self.ctx.paired_connections.refresh().await;

        if let Some(handle) = &self.ctx.app_handle {
            let _ = handle.emit_event("device-paired");
        }
    }

    async fn is_allowed(&self, remote: &EndpointId) -> bool {
        self.ctx.access.read().await.allowed.contains(remote)
    }

    async fn allow_peer(&self, remote: EndpointId) {
        let mut access = self.ctx.access.write().await;
        access.allowed.insert(remote);
    }
}

impl ProtocolHandler for ControlProtocol {
    async fn accept(&self, connection: Connection) -> Result<(), AcceptError> {
        let this = self.clone();

        tokio::spawn(async move {
            let _ = this.handle_connection(connection).await;
        });

        Ok(())
    }
}

pub struct NodeService {
    pub(crate) runtime: Arc<Mutex<NodeRuntime>>,
    pub(crate) identity: Arc<DeviceIdentity>,
    pub(crate) paired_store: Arc<PairedDeviceStore>,
    pub(crate) access: Arc<RwLock<AccessState>>,
    pub(crate) pairing_host_open: Arc<AtomicBool>,
    pub(crate) pairing_host_persistent: Arc<AtomicBool>,
    /// True after the endpoint has reached its home relay (or relay is disabled).
    network_ready: Arc<AtomicBool>,
    pub(crate) pairing_expire_task: Mutex<Option<JoinHandle<()>>>,
    pub(crate) paired_connections: Arc<PairedConnectionManager>,
    connections_supervisor: Mutex<Option<JoinHandle<()>>>,
    presence: Arc<std::sync::RwLock<HashMap<String, bool>>>,
    pub(crate) app_handle: AppHandle,
    relay_mode: Mutex<RelayMode>,
    discovery_mode: Mutex<DiscoveryModeOption>,
    /// Devices seen on the local network but not yet paired. Fed by
    /// `lan_discovery`'s mDNS pump; see `spawn_lan_event_loop`.
    nearby: Arc<Mutex<NearbyRegistry>>,
    /// `None` when discovery isn't running: `Discoverability::Off`, or the
    /// mDNS pump failed to start (no multicast, VPN, isolated guest network).
    lan_discovery: Mutex<Option<LanDiscoveryHandle>>,
    /// Peers a local user explicitly declined-and-blocked from a nearby
    /// invite. Consulted by `PairedOnlyHook::after_handshake`, ahead of the
    /// `Discoverability` check, so a blocked peer is rejected at the QUIC
    /// handshake — before it can send anything at all.
    blocked: Arc<RwLock<HashSet<String>>>,
    /// Ephemeral shares started by `invite_nearby_device`. Each holds the
    /// `Router`/endpoint that actually serves the blob, so it must outlive
    /// this call — the receiver may not download until well after the invite
    /// is delivered. Kept for the node's lifetime; dropped on `shutdown`.
    nearby_shares: Mutex<Vec<SendResult>>,
    /// Endpoint ids this node has sent a nearby invite to and not yet seen a
    /// response for. See `ControlCtx::pending_nearby_invites` for why this
    /// exists — the same map, shared with `ControlProtocol` via `ControlCtx`
    /// so the receiving side of the control connection can consult it.
    pending_nearby_invites: Arc<RwLock<HashMap<String, PendingNearbyInvite>>>,
    /// Serializes `reconfigure_network`, `set_discoverability`, and
    /// `shutdown` — all of them tear down and/or rebuild `runtime` and
    /// `lan_discovery`. Held for the whole decide-then-rebuild-then-settle
    /// sequence in each, not just the rebuild itself, so a decision made
    /// while holding it (e.g. "did this transition cross the `Off`
    /// boundary?") can't go stale before its consequence (starting
    /// discovery, clearing the registry) runs.
    network_transition: Mutex<()>,
}

impl NodeService {
    pub async fn start(
        data_dir: &Path,
        relay_mode: RelayMode,
        discovery_mode: DiscoveryModeOption,
        app_handle: AppHandle,
    ) -> anyhow::Result<Self> {

        let identity = Arc::new(load_or_create_identity(data_dir)?);
        let paired_store = Arc::new(PairedDeviceStore::new(data_dir));
        let allowed = load_allowed_from_store(&paired_store)?;

        if identity.identity_rotated {
            let stale_count = paired_store
                .mark_stale_after_local_identity_rotation()
                .unwrap_or(0);

            if stale_count > 0 {
                if let Some(handle) = &app_handle {
                    let payload = serde_json::json!({
                        "previous_endpoint_id": identity.previous_endpoint_id,
                        "current_endpoint_id": identity.endpoint_id(),
                        "stale_device_count": stale_count,
                    });

                    let _ = handle.emit_event_with_payload(
                        "identity-rotated",
                        &payload.to_string(),
                    );
                }
            }
        }

        let access = Arc::new(RwLock::new(AccessState {
            allowed: allowed.clone(),
            pairing_host_open: false,
            discoverability: Discoverability::default(),
        }));
        let pairing_host_open = Arc::new(AtomicBool::new(false));
        let pairing_host_persistent = Arc::new(AtomicBool::new(false));
        let network_ready = Arc::new(AtomicBool::new(false));
        let presence = Arc::new(std::sync::RwLock::new(HashMap::new()));
        let blocked: Arc<RwLock<HashSet<String>>> = Arc::new(RwLock::new(HashSet::new()));
        let pending_nearby_invites: Arc<RwLock<HashMap<String, PendingNearbyInvite>>> =
            Arc::new(RwLock::new(HashMap::new()));
        // Created before `build_runtime` (rather than after, as in an earlier
        // version) because `ControlCtx` now needs it too — the sender-side
        // half of mutual nearby pairing expires its own Nearby entry for the
        // peer it just pledged to trust.
        let nearby = Arc::new(Mutex::new(NearbyRegistry::new()));

        let paired_connections = Arc::new(PairedConnectionManager::new(
            identity.clone(),
            paired_store.clone(),
            presence.clone(),
            app_handle.clone(),
        ));

        let runtime = build_runtime(
            identity.clone(),
            paired_store.clone(),
            access.clone(),
            blocked.clone(),
            pending_nearby_invites.clone(),
            nearby.clone(),
            pairing_host_persistent.clone(),
            app_handle.clone(),
            presence.clone(),
            paired_connections.clone(),
            network_ready.clone(),
            relay_mode.clone(),
            discovery_mode.clone(),
        )
        .await?;
        let runtime = Arc::new(Mutex::new(runtime));
        paired_connections.attach_runtime(runtime.clone());
        let connections_supervisor = paired_connections.start();

        let lan_discovery = if should_publish_mdns(access.read().await.discoverability) {
            let endpoint = {
                let runtime = runtime.lock().await;
                runtime.endpoint.clone()
            };
            start_lan_discovery(
                &endpoint,
                nearby.clone(),
                access.clone(),
                paired_connections.clone(),
                runtime.clone(),
                app_handle.clone(),
            )
        } else {
            None
        };

        Ok(Self {
            runtime,
            identity,
            paired_store,
            access,
            pairing_host_open,
            pairing_host_persistent,
            network_ready,
            pairing_expire_task: Mutex::new(None),
            paired_connections,
            connections_supervisor: Mutex::new(Some(connections_supervisor)),
            presence,
            app_handle,
            relay_mode: Mutex::new(relay_mode),
            discovery_mode: Mutex::new(discovery_mode),
            nearby,
            lan_discovery: Mutex::new(lan_discovery),
            network_transition: Mutex::new(()),
            blocked,
            nearby_shares: Mutex::new(Vec::new()),
            pending_nearby_invites,
        })
    }

    pub async fn shutdown(&self) -> anyhow::Result<()> {
        // Same lock `reconfigure_network`/`set_discoverability` hold for their
        // whole transition — without it, a shutdown racing an in-flight
        // rebuild could close the endpoint the rebuild just built, or the
        // rebuild could resurrect a `lan_discovery` handle after shutdown
        // just stopped it.
        let _guard = self.network_transition.lock().await;

        self.stop_pairing_host().await;
        self.stop_lan_discovery().await;
        if let Some(handle) = self.connections_supervisor.lock().await.take() {
            handle.abort();

        }
        self.paired_connections.shutdown().await;
        self.nearby_shares.lock().await.clear();
        let runtime = self.runtime.lock().await;
        runtime.router.shutdown().await?;
        runtime.endpoint.close().await;

        Ok(())
    }

    pub async fn reconfigure_network(
        &self,
        relay_mode: RelayMode,
        discovery_mode: DiscoveryModeOption,
    ) -> anyhow::Result<()> {
        let _guard = self.network_transition.lock().await;

        {
            let current_relay = self.relay_mode.lock().await;
            let current_discovery = self.discovery_mode.lock().await;
            if format!("{current_relay:?}") == format!("{relay_mode:?}")
                && format!("{current_discovery:?}") == format!("{discovery_mode:?}")
            {
                return Ok(());
            }
        }

        self.rebuild_network(relay_mode, discovery_mode).await
    }

    /// Closes the current endpoint and router and rebuilds them, then
    /// restarts LAN discovery on the new endpoint per the current
    /// `Discoverability` setting. Shared by `reconfigure_network` (relay or
    /// discovery-mode changes) and `set_discoverability` transitions across
    /// the `Off` boundary.
    ///
    /// The rebuild is the only reliable way to stop mDNS advertising: iroh
    /// 1.0.3 has no API to unregister an address-lookup service from a live
    /// endpoint, and `MdnsAddressLookup`'s `advertise` flag is fixed at
    /// construction, so a lightweight stop/start toggle on the same endpoint
    /// cannot actually stop the broadcast and would leak one live mDNS actor
    /// (plus its multicast socket) per toggle.
    ///
    /// Callers must already hold `self.network_transition` for their entire
    /// decide-then-rebuild-then-settle sequence — this method assumes it, it
    /// doesn't acquire it itself. Without that, two overlapping rebuilds can
    /// interleave their close/build steps (the second closing the endpoint
    /// the first just built) and whichever caller's post-rebuild decision
    /// (start discovery, clear the registry) runs last wins arbitrarily
    /// instead of reflecting its own transition.
    async fn rebuild_network(
        &self,
        relay_mode: RelayMode,
        discovery_mode: DiscoveryModeOption,
    ) -> anyhow::Result<()> {
        self.stop_pairing_host().await;

        self.network_ready.store(false, Ordering::SeqCst);
        if let Some(handle) = &self.app_handle {
            let _ = handle.emit_event("device-node-network-warming");
        }

        // Stop the old consumer + pump before the endpoint they're bound to
        // is closed below. Aborting drops our `MdnsAddressLookup` clone; the
        // endpoint's own registered clone drops with it once the old
        // `Endpoint`'s last handle goes away (when `*runtime = new_runtime`
        // replaces it), letting the old actor and its multicast socket
        // actually die instead of leaking.
        self.stop_lan_discovery().await;

        let mut runtime = self.runtime.lock().await;
        runtime.router.shutdown().await?;
        runtime.endpoint.close().await;

        let new_runtime = build_runtime(
            self.identity.clone(),
            self.paired_store.clone(),
            self.access.clone(),
            self.blocked.clone(),
            self.pending_nearby_invites.clone(),
            self.nearby.clone(),
            self.pairing_host_persistent.clone(),
            self.app_handle.clone(),
            self.presence.clone(),
            self.paired_connections.clone(),
            self.network_ready.clone(),
            relay_mode.clone(),
            discovery_mode.clone(),
        )
        .await?;

        let endpoint = new_runtime.endpoint.clone();
        *runtime = new_runtime;
        drop(runtime);

        self.paired_connections.refresh().await;
        *self.relay_mode.lock().await = relay_mode;
        *self.discovery_mode.lock().await = discovery_mode;

        if should_publish_mdns(self.access.read().await.discoverability) {
            let discovery = start_lan_discovery(
                &endpoint,
                self.nearby.clone(),
                self.access.clone(),
                self.paired_connections.clone(),
                self.runtime.clone(),
                self.app_handle.clone(),
            );
            *self.lan_discovery.lock().await = discovery;
        }

        Ok(())
    }

    /// Stops the LAN-discovery consumer task and its mDNS pump, if running.
    async fn stop_lan_discovery(&self) {
        if let Some(handle) = self.lan_discovery.lock().await.take() {
            handle.shutdown();
        }
    }

    pub fn is_network_ready(&self) -> bool {
        self.network_ready.load(Ordering::SeqCst)
    }

    pub fn device_info(&self) -> DeviceInfo {
        DeviceInfo::from(self.identity.as_ref())
    }

    pub fn set_device_display_name(&self, display_name: &str) -> anyhow::Result<DeviceInfo> {
        let info = self.identity.set_display_name(display_name)?;

        Ok(info)
    }

    pub fn rename_paired(
        &self,
        endpoint_id: &str,
        display_name: &str,
    ) -> anyhow::Result<PairedDevice> {
        let device = self.paired_store.rename(endpoint_id, display_name)?;

        Ok(device)
    }

    pub fn list_paired(&self) -> anyhow::Result<Vec<PairedDeviceInfo>> {
        let devices = self.paired_store.list()?;
        let presence = self.presence.read().expect("presence lock");
        let infos: Vec<PairedDeviceInfo> = devices
            .into_iter()
            .map(|device| {
                let online = presence
                    .get(&device.endpoint_id.to_lowercase())
                    .or_else(|| presence.get(&device.endpoint_id))
                    .copied()
                    .unwrap_or(false);
                PairedDeviceInfo::from_device(device, online)
            })
            .collect();

        Ok(infos)
    }

    pub async fn forget_paired(&self, endpoint_id: &str) -> anyhow::Result<()> {
        debug!(
            target: "dashbeam::_events::pairing::forget",
            remote = %endpoint_id,
        );

        let stored_relay = self
            .paired_store
            .get(endpoint_id)?
            .and_then(|d| d.relay_url);
        if let Ok(id) = EndpointId::from_str(endpoint_id) {
            self.access.write().await.allowed.remove(&id);

        }
        self.paired_store.forget(endpoint_id)?;
        self.paired_connections.forget(endpoint_id).await;
        set_presence(
            &self.presence,
            &self.app_handle,
            &self.paired_store,
            endpoint_id,
            false
        );
        if let Some(handle) = &self.app_handle {
            let payload = serde_json::json!({
                "endpoint_id": endpoint_id,
                "reason": "local",
            });
            let _ = handle.emit_event_with_payload("device-unpaired", &payload.to_string());
        }

        let runtime = self.runtime.clone();
        let identity = self.identity.clone();
        let endpoint_id = endpoint_id.to_string();
        tokio::spawn(async move {
            let _ = send_forget_to_peer(
                &runtime,
                &identity,
                &endpoint_id,
                stored_relay.as_deref(),
            )
            .await;
        });
        Ok(())
    }

    /// Immediate pairing code from local identity. Never waits on presence or
    /// relay probes — optional custom-relay hint is best-effort via try_lock.
    pub fn pairing_ticket(&self) -> anyhow::Result<String> {
        let relay_url = match self.runtime.try_lock() {
            Ok(runtime) => {
                let mut addr = runtime.endpoint.addr();
                apply_options(&mut addr, AddrInfoOptions::Relay);
                let url = addr.relay_urls().next().map(|u| u.to_string());
                url
            }
            Err(_) => None,
        };
        let ticket = protocol::PairingTicket {
            v: 1,
            kind: protocol::PairingTicket::KIND.to_string(),
            endpoint_id: self.identity.endpoint_id(),
            relay_url,
        };
        ticket.encode()
    }

    pub async fn invite_paired_device(
        &self,
        remote_endpoint_id: &str,
        blob_ticket: &str,
        file_count: u32,
        total_size: u64,
    ) -> anyhow::Result<bool> {
        let remote = EndpointId::from_str(remote_endpoint_id)?;
        debug!(
            target: "dashbeam::_events::pairing::invite_sent",
            remote = %remote.fmt_short(),
            file_count,
            total_size,
        );
        let access = self.access.read().await;
        let in_allowlist = access.allowed.contains(&remote);
        drop(access);

        if !in_allowlist {

            anyhow::bail!("unknown paired device");
        }

        self.deliver_invite(remote_endpoint_id, blob_ticket, file_count, total_size, true)
            .await
    }

    /// Sends to a device found on the local network. Mints a normal blob
    /// ticket with the same ephemeral-share machinery any other send uses,
    /// then delivers it through [`Self::deliver_invite`] — byte-for-byte the
    /// same `ControlMessage::Invite` a paired device sends. The only
    /// difference is the receiver has no `PairedDevice` record yet, so its UI
    /// shows the sender's fingerprint for confirmation instead of treating
    /// this as routine.
    pub async fn invite_nearby_device(
        &self,
        endpoint_id: &str,
        paths: Vec<String>,
    ) -> anyhow::Result<()> {
        let nearby_device = self
            .nearby
            .lock()
            .await
            .list()
            .into_iter()
            .find(|d| d.endpoint_id == endpoint_id);
        anyhow::ensure!(nearby_device.is_some(), "device is not on the local network");
        anyhow::ensure!(!paths.is_empty(), "no paths provided for sharing");

        let path_bufs: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
        let file_count = path_bufs.len() as u32;
        let result = start_share_items(path_bufs, SendOptions::default(), &self.app_handle, None)
            .await
            .context("mint blob ticket for nearby invite")?;
        let ticket = result.ticket.clone();
        let total_size = result.size;

        // The invite hands out a ticket good for a download that may happen
        // well after this call returns — the share (and the ephemeral
        // endpoint/router serving it) must outlive this function, so it's
        // kept here rather than dropped at the end of the block.
        self.nearby_shares.lock().await.push(result);

        // A device we've never talked to has no cached `paired_connections`
        // session and never will — skip straight to a fresh dial rather than
        // waiting out `invite_wait_timeout`.
        let delivered = self
            .deliver_invite(endpoint_id, &ticket, file_count, total_size, false)
            .await?;
        anyhow::ensure!(delivered, "device is not reachable");

        // Record this as an outstanding nearby invite so a later
        // `InviteResponse` from this (still unpaired, from our side) peer is
        // recognized as a real answer rather than an unsolicited claim from
        // an arbitrary unpaired stranger — and, if it's an accept, carries
        // enough identity to record them as paired on our side too (mutual
        // pairing). Snapshotted now rather than re-read from the Nearby list
        // when the response arrives, because that entry may have expired by
        // then.
        let pending = match nearby_device.filter(|d| d.identified) {
            Some(d) => PendingNearbyInvite {
                display_name: d
                    .display_name
                    .unwrap_or_else(|| endpoint_id.chars().take(8).collect()),
                device_type: d
                    .device_type
                    .unwrap_or_else(protocol::identity::default_device_type),
                os: d.os.unwrap_or_default(),
            },
            None => PendingNearbyInvite {
                display_name: endpoint_id.chars().take(8).collect(),
                device_type: protocol::identity::default_device_type(),
                os: String::new(),
            },
        };
        self.pending_nearby_invites
            .write()
            .await
            .insert(endpoint_id.to_string(), pending);

        Ok(())
    }

    /// Connects to `remote_endpoint_id` and delivers a single `Invite`
    /// message. Shared by [`Self::invite_paired_device`] and
    /// [`Self::invite_nearby_device`] — same wire message either way; only
    /// the precondition each checks beforehand differs. `use_cached_session`
    /// controls whether a `paired_connections` session is worth checking
    /// first: a paired device usually keeps one open, but a peer we're
    /// inviting for the first time never has one.
    async fn deliver_invite(
        &self,
        remote_endpoint_id: &str,
        blob_ticket: &str,
        file_count: u32,
        total_size: u64,
        use_cached_session: bool,
    ) -> anyhow::Result<bool> {
        let remote = EndpointId::from_str(remote_endpoint_id)?;
        let stored_relay = self
            .paired_store
            .get(remote_endpoint_id)?
            .and_then(|d| d.relay_url);

        let cached = if use_cached_session {
            self.paired_connections
                .wait_for_connection(remote_endpoint_id, invite_wait_timeout())
                .await
        } else {
            None
        };

        let conn = match cached {
            Some(conn) => conn,
            None => {
                let endpoint = {
                    let runtime = self.runtime.lock().await;
                    runtime.endpoint.clone()
                };
                let addr = build_control_connect_addr(
                    &endpoint,
                    remote,
                    stored_relay.as_deref(),
                );

                let connect = tokio::time::timeout(
                    Duration::from_secs(PRESENCE_CONNECT_TIMEOUT_SECS),
                    endpoint.connect(addr, CONTROL_ALPN),
                )
                .await;
                match connect {
                    Ok(Ok(conn)) => {
                        if use_cached_session {
                            let now = protocol::identity::unix_now_ms();
                            let _ = self.paired_store.touch(remote_endpoint_id, now);
                            set_presence(
                                &self.presence,
                                &self.app_handle,
                                &self.paired_store,
                                remote_endpoint_id,
                                true,
                            );
                        }
                        conn
                    }
                    Ok(Err(_err)) => {
                        return Ok(false);
                    }
                    Err(_) => {
                        return Ok(false);
                    }
                }
            }
        };

        let (mut send, _recv) = match conn.open_bi().await {
            Ok(streams) => streams,
            Err(err) => {
                return Err(err).context("open bi stream for invite");
            }
        };

        let invite = ControlMessage::Invite {
            blob_ticket: blob_ticket.to_string(),
            file_count,
            total_size,
            sender_name: self.identity.display_name(),
        };
        if let Err(err) = write_message(&mut send, &invite).await {

            return Err(err).context("write Invite message");
        }

        // Hold the connection in the background so the receiver can read the
        // invite, without blocking the caller (the UI needs a fast result).
        drop(send);
        tokio::spawn(async move {

            match tokio::time::timeout(Duration::from_secs(15), conn.closed()).await {
                Ok(_closed) => {},
                // Expected when the receiver keeps the session open while it
                // downloads; the invite itself was already delivered.
                Err(_) => {},
            }
        });

        Ok(true)
    }

    pub async fn respond_paired_invite(
        &self,
        remote_endpoint_id: &str,
        accepted: bool,
    ) -> anyhow::Result<()> {
        let remote = EndpointId::from_str(remote_endpoint_id)?;
        debug!(
            target: "dashbeam::_events::pairing::invite_response",
            remote = %remote.fmt_short(),
            accepted,
        );
        let access = self.access.read().await;
        let in_allowlist = access.allowed.contains(&remote);
        drop(access);
        if !in_allowlist {

            anyhow::bail!("unknown paired device");
        }

        self.deliver_invite_response(remote_endpoint_id, accepted, true)
            .await
    }

    /// Accepting is what creates the trust relationship. The user has
    /// compared the fingerprint on screen; recording the peer as paired is
    /// the durable consequence of that decision. Delegates the actual
    /// accept notification to [`Self::deliver_invite_response`] — the same
    /// message an already-paired device's accept sends.
    pub async fn accept_nearby_invite(&self, endpoint_id: &str) -> anyhow::Result<()> {
        let info = self
            .probe_identity(endpoint_id)
            .await
            .unwrap_or_else(|_| DeviceInfo {
                endpoint_id: endpoint_id.to_string(),
                display_name: endpoint_id.chars().take(8).collect(),
                device_type: protocol::identity::default_device_type(),
                os: String::new(),
            });

        let now = protocol::identity::unix_now_ms();
        self.paired_store.remember(PairedDevice {
            endpoint_id: info.endpoint_id.clone(),
            display_name: info.display_name,
            device_type: info.device_type,
            os: info.os,
            paired_at: now,
            last_seen_at: now,
            relay_url: None,
            pairing_status: PairingStatus::default(),
        })?;

        // Now that a paired record exists, it must not also show under Nearby.
        self.nearby.lock().await.expire(endpoint_id);
        self.access.write().await.allowed.insert(endpoint_id.parse()?);
        self.paired_connections.refresh().await;

        if let Some(handle) = &self.app_handle {
            let _ = handle.emit_event("device-paired");
        }

        // The pairing above is already durable and the UI has already been
        // told about it — notifying the sender is a courtesy on top, not a
        // condition of acceptance succeeding. If the sender has gone away
        // (network blip, closed app) since sending the invite, that must not
        // undo — or report as failed — an accept that already happened.
        // We just met this peer — never a cached session to wait on.
        if let Err(err) = self.deliver_invite_response(endpoint_id, true, false).await {
            tracing::debug!(
                "accepted nearby invite from {endpoint_id} but could not notify the sender: {err:#}"
            );
        }

        Ok(())
    }

    pub async fn decline_nearby_invite(
        &self,
        endpoint_id: &str,
        block: bool,
    ) -> anyhow::Result<()> {
        if block {
            self.nearby.lock().await.expire(endpoint_id);
            self.blocked.write().await.insert(endpoint_id.to_string());
        }
        self.deliver_invite_response(endpoint_id, false, false)
            .await
    }

    /// Connects to `remote_endpoint_id` and delivers an `InviteResponse`.
    /// Shared by [`Self::respond_paired_invite`], [`Self::accept_nearby_invite`],
    /// and [`Self::decline_nearby_invite`] — see [`Self::deliver_invite`] for
    /// why `use_cached_session` exists.
    async fn deliver_invite_response(
        &self,
        remote_endpoint_id: &str,
        accepted: bool,
        use_cached_session: bool,
    ) -> anyhow::Result<()> {
        let remote = EndpointId::from_str(remote_endpoint_id)?;
        let response = if accepted {
            InviteResponse::Accepted
        } else {
            InviteResponse::Declined
        };

        let stored_relay = self
            .paired_store
            .get(remote_endpoint_id)?
            .and_then(|d| d.relay_url);

        let cached = if use_cached_session {
            self.paired_connections
                .wait_for_connection(remote_endpoint_id, invite_wait_timeout())
                .await
        } else {
            None
        };

        let conn = match cached {
            Some(conn) => conn,
            None => {
                let endpoint = {
                    let runtime = self.runtime.lock().await;
                    runtime.endpoint.clone()
                };
                let addr = build_control_connect_addr(
                    &endpoint,
                    remote,
                    stored_relay.as_deref(),
                );
                let connect = tokio::time::timeout(
                    Duration::from_secs(PRESENCE_CONNECT_TIMEOUT_SECS),
                    endpoint.connect(addr, CONTROL_ALPN),
                )
                .await;
                match connect {
                    Ok(Ok(conn)) => conn,
                    Ok(Err(err)) => {
                        return Err(err).context("invite response connect failed");
                    }
                    Err(_) => anyhow::bail!("invite response connect timeout"),
                }
            }
        };

        let (mut send, _recv) = conn
            .open_bi()
            .await
            .context("open bi stream for invite response")?;
        let message = ControlMessage::InviteResponse {
            session_id: String::new(),
            response,
        };
        write_message(&mut send, &message)
            .await
            .context("write InviteResponse message")?;

        // As with `deliver_invite`: when this is a freshly dialed connection
        // (no cached session — always true for a nearby accept/decline, and
        // possible for the paired path too), `conn` is the *only* handle to
        // it. Returning immediately would drop that handle — and iroh closes
        // the connection when its last handle drops — racing the still
        // in-flight write against the receiver ever calling `accept_bi()`.
        // Hold it open in the background long enough for that race to
        // resolve in the write's favor; the caller doesn't need to wait for
        // it.
        drop(send);
        tokio::spawn(async move {
            let _ = tokio::time::timeout(Duration::from_secs(5), conn.closed()).await;
        });

        Ok(())
    }

    /// Rebuilds the network and clears the Nearby list on a move to `Off`;
    /// rebuilds it again (this time starting discovery) on a move away from
    /// `Off`. Any other transition (e.g. `Everyone` <-> `PairedOnly`) touches
    /// neither — both still publish over mDNS, they only differ in who gets
    /// an identity reply.
    ///
    /// A rebuild, not a lightweight toggle: iroh 1.0.3 has no API to
    /// unregister an address-lookup service from a live endpoint, so the only
    /// way to actually stop (or resume) the mDNS advertisement is to close
    /// the endpoint the old `MdnsAddressLookup` clone was registered on. See
    /// `rebuild_network`.
    ///
    /// The whole decide-then-rebuild-then-clear sequence runs under
    /// `network_transition`, held from before `previous`/`now_off` are read
    /// to after the trailing clear. Without that, a second call (another
    /// `set_discoverability`, or a concurrent `reconfigure_network`) could
    /// run its own rebuild in the gap — `now_off`, captured before the lock
    /// existed, would then no longer describe the state by the time this
    /// call's clear-or-not decision executed, e.g. wiping a registry a
    /// competing transition had just repopulated. Holding the lock for the
    /// full sequence means no such gap exists: whichever call is currently
    /// inside it is the only one touching `runtime` or `lan_discovery`.
    pub async fn set_discoverability(&self, setting: Discoverability) {
        let _guard = self.network_transition.lock().await;

        let previous = {
            let mut access = self.access.write().await;
            let previous = access.discoverability;
            access.discoverability = setting;
            previous
        };

        let now_off = matches!(setting, Discoverability::Off);
        if now_off == matches!(previous, Discoverability::Off) {
            return;
        }

        let (relay_mode, discovery_mode) = {
            (
                self.relay_mode.lock().await.clone(),
                self.discovery_mode.lock().await.clone(),
            )
        };
        if let Err(err) = self.rebuild_network(relay_mode, discovery_mode).await {
            tracing::debug!("network rebuild for discoverability change failed: {err:#}");
        }

        if now_off {
            // Still holding `network_transition`, so no other transition can
            // have run between `rebuild_network` returning and this clear —
            // `now_off` is still accurate. Note this doesn't make the
            // consumer-task shutdown inside `rebuild_network` itself
            // instantaneous (`abort()` only requests cancellation, landing at
            // the task's next await point); it only guarantees nothing *else*
            // in this process can race the clear.
            self.nearby.lock().await.clear();
        }
    }

    pub async fn discoverability(&self) -> Discoverability {
        self.access.read().await.discoverability
    }

    /// Devices currently seen on the local network but not yet paired.
    pub async fn list_nearby(&self) -> Vec<NearbyDevice> {
        self.nearby.lock().await.list()
    }

    /// Test-only: seeds the Nearby registry as if a real mDNS sighting had
    /// just come in, without needing actual multicast. `NearbyRegistry` is
    /// pure state (see its module docs) so this is exactly what
    /// `spawn_lan_event_loop` does on `LanEvent::Appeared` — it just skips
    /// the socket. Lets integration tests exercise `invite_nearby_device`'s
    /// "device must be on the local network" precondition deterministically
    /// on CI runners that block multicast.
    #[doc(hidden)]
    pub async fn inject_nearby_device_for_tests(&self, endpoint_id: &str) {
        self.nearby.lock().await.observe(endpoint_id, false);
    }

    /// Dial a peer's control ALPN and ask who it is. Used for devices found on
    /// the local network, where mDNS supplies a node id and nothing else.
    pub async fn probe_identity(&self, endpoint_id: &str) -> anyhow::Result<DeviceInfo> {
        probe_identity_via(&self.runtime, endpoint_id).await
    }
}

fn load_allowed_from_store(paired_store: &PairedDeviceStore) -> anyhow::Result<HashSet<EndpointId>> {
    let mut allowed = HashSet::new();
    for device in paired_store.list()? {
        if !device.pairing_status.is_connectable() {

            continue;
        }
        if let Ok(id) = EndpointId::from_str(&device.endpoint_id) {
            allowed.insert(id);
        }
    }

    Ok(allowed)
}

/// Bundles the mDNS pump (`LanDiscovery`) with its consumer task so both are
/// torn down together. iroh 1.0.3 has no API to unregister an address-lookup
/// service from a live endpoint and `MdnsAddressLookup`'s `advertise` flag is
/// fixed at construction, so this only ever gets a clean shutdown by closing
/// the endpoint the pump's `MdnsAddressLookup` clone is registered on — see
/// `NodeService::rebuild_network`.
struct LanDiscoveryHandle {
    pump: LanDiscovery,
    consumer: JoinHandle<()>,
}

impl LanDiscoveryHandle {
    /// Aborts the consumer, then the pump. `abort()` only *requests*
    /// cancellation — the task actually stops at its next await point (e.g.
    /// mid-`nearby.lock().await` or `rx.recv().await`), not synchronously
    /// here. Aborting the consumer first, before the pump, still narrows the
    /// window: nothing enqueues a *new* event once the pump is stopped, and
    /// in practice the consumer's own abort lands well before the endpoint
    /// rebuild that follows this call completes.
    fn shutdown(self) {
        self.consumer.abort();
        self.pump.shutdown();
    }
}

/// Starts the mDNS pump and its consumer loop, wiring sightings into `nearby`
/// and identity probes into the discovery/identified events.
///
/// Failure is **not** fatal: no multicast, an active VPN, or an isolated guest
/// network all produce an error here, and the app must keep working with
/// pairing codes and relays. Mirrors how `node_init_error` treats a failed
/// `NodeService`.
fn start_lan_discovery(
    endpoint: &Endpoint,
    nearby: Arc<Mutex<NearbyRegistry>>,
    access: Arc<RwLock<AccessState>>,
    paired_connections: Arc<PairedConnectionManager>,
    runtime: Arc<Mutex<NodeRuntime>>,
    app_handle: AppHandle,
) -> Option<LanDiscoveryHandle> {
    let (tx, rx) = mpsc::unbounded_channel();
    match LanDiscovery::start(endpoint, tx) {
        Ok(pump) => {
            let consumer =
                spawn_lan_event_loop(rx, nearby, access, paired_connections, runtime, app_handle);
            Some(LanDiscoveryHandle { pump, consumer })
        }
        Err(err) => {
            tracing::debug!("mDNS discovery unavailable: {err:#}");
            emit_nearby_reason(&app_handle, "nearby-unavailable", &err.to_string());
            None
        }
    }
}

/// Consumes `LanEvent`s and turns them into `NearbyRegistry` updates and UI
/// events. All policy decisions about what a sighting means live here —
/// `lan_discovery` itself only knows how to talk to multicast.
fn spawn_lan_event_loop(
    mut rx: mpsc::UnboundedReceiver<LanEvent>,
    nearby: Arc<Mutex<NearbyRegistry>>,
    access: Arc<RwLock<AccessState>>,
    paired_connections: Arc<PairedConnectionManager>,
    runtime: Arc<Mutex<NodeRuntime>>,
    app_handle: AppHandle,
) -> JoinHandle<()> {
    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                LanEvent::Appeared { endpoint_id } => {
                    let is_paired = is_paired_endpoint(&access, &endpoint_id).await;
                    let outcome = nearby.lock().await.observe(&endpoint_id, is_paired);
                    match outcome {
                        ObserveOutcome::ProbeNeeded => {
                            emit_nearby(&app_handle, "nearby-device-found", &endpoint_id);
                            spawn_identity_probe(
                                endpoint_id,
                                runtime.clone(),
                                nearby.clone(),
                                app_handle.clone(),
                            );
                        }
                        ObserveOutcome::Paired => {
                            // Strongest possible signal that a known device
                            // just came online — retry presence now instead
                            // of waiting out its exponential backoff.
                            paired_connections.nudge_reconnect(&endpoint_id).await;
                        }
                        ObserveOutcome::Known | ObserveOutcome::Invalid => {}
                    }
                }
                LanEvent::Vanished { endpoint_id } => {
                    if nearby.lock().await.expire(&endpoint_id) {
                        emit_nearby(&app_handle, "nearby-device-lost", &endpoint_id);
                    }
                }
            }
        }
    })
}

/// Runs `probe_identity_via` in the background and feeds a successful reply
/// back into the registry. Old build peers or a declined probe leave the
/// device listed but unidentified, so the user can still send to it.
fn spawn_identity_probe(
    endpoint_id: String,
    runtime: Arc<Mutex<NodeRuntime>>,
    nearby: Arc<Mutex<NearbyRegistry>>,
    app_handle: AppHandle,
) {
    tokio::spawn(async move {
        match probe_identity_via(&runtime, &endpoint_id).await {
            Ok(info) => {
                // `ControlMessage::Identity.os` is `#[serde(default)]`, so an
                // old-build peer's reply deserializes to `""` rather than
                // being absent — normalize that to "unknown" here, at the
                // probe-to-registry boundary, rather than storing `Some("")`.
                let os = if info.os.is_empty() {
                    None
                } else {
                    Some(info.os)
                };
                let updated = nearby.lock().await.set_identity(
                    &endpoint_id,
                    info.display_name,
                    info.device_type,
                    os,
                );
                if updated {
                    emit_nearby(&app_handle, "nearby-device-identified", &endpoint_id);
                }
            }
            Err(err) => {
                tracing::debug!("identity probe for {endpoint_id} failed: {err:#}");
            }
        }
    });
}

/// Whether `endpoint_id` is already in the paired allowlist. Nearby ignores
/// paired peers entirely — normal presence tracking applies to them instead.
async fn is_paired_endpoint(access: &Arc<RwLock<AccessState>>, endpoint_id: &str) -> bool {
    match EndpointId::from_str(endpoint_id) {
        Ok(id) => access.read().await.allowed.contains(&id),
        Err(_) => false,
    }
}

/// Dial a peer's control ALPN and ask who it is. Shared by `NodeService::probe_identity`
/// (a caller already holding a `NodeService`) and the Nearby identity probe
/// (a background task that only has the `runtime` handle).
async fn probe_identity_via(
    runtime: &Arc<Mutex<NodeRuntime>>,
    endpoint_id: &str,
) -> anyhow::Result<DeviceInfo> {
    let remote: EndpointId = endpoint_id.parse()?;
    let endpoint = {
        let runtime = runtime.lock().await;
        runtime.endpoint.clone()
    };
    let conn = tokio::time::timeout(
        Duration::from_secs(5),
        endpoint.connect(remote, CONTROL_ALPN),
    )
    .await
    .context("identity probe timed out")??;

    let (mut send, mut recv) = conn.open_bi().await?;
    write_message(&mut send, &ControlMessage::WhoAreYou).await?;
    match tokio::time::timeout(Duration::from_secs(5), read_message(&mut recv))
        .await
        .context("identity reply timed out")??
    {
        ControlMessage::Identity {
            endpoint_id,
            display_name,
            device_type,
            os,
        } => Ok(DeviceInfo {
            endpoint_id,
            display_name,
            device_type,
            os,
        }),
        other => anyhow::bail!("unexpected reply to WhoAreYou: {other:?}"),
    }
}

/// Emits a Nearby event carrying just the endpoint id, matching what the
/// frontend needs to look up the affected row in its own Nearby list.
fn emit_nearby(app_handle: &AppHandle, event: &str, endpoint_id: &str) {
    emit_nearby_payload(
        app_handle,
        event,
        serde_json::json!({ "endpointId": endpoint_id }),
    );
}

/// Emits a Nearby event carrying a free-form reason, used for `nearby-unavailable`.
fn emit_nearby_reason(app_handle: &AppHandle, event: &str, reason: &str) {
    emit_nearby_payload(app_handle, event, serde_json::json!({ "reason": reason }));
}

fn emit_nearby_payload(app_handle: &AppHandle, event: &str, payload: serde_json::Value) {
    let Some(handle) = app_handle.as_ref() else {
        return;
    };
    if let Err(err) = handle.emit_event_with_payload(event, &payload.to_string()) {
        tracing::debug!("emit {event} failed: {err}");
    }
}

async fn send_forget_to_peer(
    runtime: &Arc<Mutex<NodeRuntime>>,
    identity: &DeviceIdentity,
    endpoint_id: &str,
    stored_relay: Option<&str>,
) -> anyhow::Result<()> {
    let remote = EndpointId::from_str(endpoint_id)?;

    let endpoint = {
        let runtime_guard = runtime.lock().await;
        runtime_guard.endpoint.clone()
    };
    let addr = build_control_connect_addr(&endpoint, remote, stored_relay);

    let connect = tokio::time::timeout(
        Duration::from_secs(PRESENCE_CONNECT_TIMEOUT_SECS),
        endpoint.connect(addr, CONTROL_ALPN),
    )
    .await;

    let conn = match connect {
        Ok(Ok(conn)) => {

            conn
        }
        Ok(Err(err)) => {
            return Err(err).context("forget connect failed");
        }
        Err(_) => {

            anyhow::bail!("forget connect timeout");
        }
    };

    let keying = export_connection_keying_material(&conn)?;
    let (mut send, _recv) = conn.open_bi().await.context("forget open bi")?;
    let forget = ControlMessage::Forget {
        signature: sign_challenge(&identity.secret_key, &keying),
    };
    write_message(&mut send, &forget)
        .await
        .context("forget write message")?;
    let _ = send.finish();
    // The peer closes the connection after reading the message; the timeout
    // is a flush fallback for older peers that keep it open.
    match tokio::time::timeout(Duration::from_secs(5), conn.closed()).await {
        Ok(_closed) => {},
        Err(_) => {},
    }

    Ok(())
}

fn endpoint_home_relay_url(endpoint: &Endpoint) -> Option<String> {
    let mut local_addr = endpoint.addr();
    apply_options(&mut local_addr, AddrInfoOptions::Relay);
    let url = local_addr.relay_urls().next().map(|u| u.to_string());
    url
}

async fn build_runtime(
    identity: Arc<DeviceIdentity>,
    paired_store: Arc<PairedDeviceStore>,
    access: Arc<RwLock<AccessState>>,
    blocked: Arc<RwLock<HashSet<String>>>,
    pending_nearby_invites: Arc<RwLock<HashMap<String, PendingNearbyInvite>>>,
    nearby: Arc<Mutex<NearbyRegistry>>,
    pairing_host_persistent: Arc<AtomicBool>,
    app_handle: AppHandle,
    presence: Arc<std::sync::RwLock<HashMap<String, bool>>>,
    paired_connections: Arc<PairedConnectionManager>,
    network_ready: Arc<AtomicBool>,
    relay_mode: RelayMode,
    discovery_mode: DiscoveryModeOption,
) -> anyhow::Result<NodeRuntime> {

    let hook = PairedOnlyHook {
        access: access.clone(),
        blocked,
    };

    // The control endpoint must both publish (so paired peers can find us by
    // endpoint id) and resolve (to reach them). Custom mode uses a self-hosted
    // pkarr relay via HTTPS; optional dns_origin also enables real-DNS resolve.
    // Default keeps iroh's n0 discovery.
    //
    // OS CA trust only for custom discovery/relay — n0 trailing-dot hostnames
    // break Windows CERT_CHAIN_POLICY_SSL literal name matching.
    let custom_infra = matches!(discovery_mode, DiscoveryModeOption::Custom { .. })
        || matches!(relay_mode, RelayMode::Custom(_));
    let builder = match &discovery_mode {
        DiscoveryModeOption::Custom {
            pkarr_relay_url,
            dns_origin,
        } => {
            let mut builder =
                protocol::with_system_ca_if_custom(Endpoint::builder(presets::Minimal), custom_infra)
                    .address_lookup(PkarrPublisher::builder(pkarr_relay_url.clone()))
                    .address_lookup(PkarrResolver::builder(pkarr_relay_url.clone()));
            if let Some(origin) = dns_origin {
                builder = builder.address_lookup(DnsAddressLookup::builder(origin.clone()));
            }
            builder
        }
        DiscoveryModeOption::Default => {
            protocol::with_system_ca_if_custom(Endpoint::builder(presets::N0), custom_infra)
                .address_lookup(PkarrPublisher::n0_dns())
        }
    };

    let endpoint = builder
        .secret_key(identity.secret_key.clone())
        .relay_mode(relay_mode.clone())
        .hooks(hook)
        .alpns(vec![CONTROL_ALPN.to_vec()])
        .bind()
        .await?;

    // Publish the node immediately after bind so pairing UI/API are available
    // without waiting on relay home connection (often several seconds on mobile).
    let home_relay_url = Arc::new(std::sync::RwLock::new(endpoint_home_relay_url(&endpoint)));

    let control = ControlProtocol {
        ctx: ControlCtx {
            identity,
            paired_store,
            access,
            pairing_host_persistent,
            app_handle: app_handle.clone(),
            home_relay_url: home_relay_url.clone(),
            presence,
            paired_connections,
            pending_nearby_invites,
            nearby,
        },
    };

    let router = Router::builder(endpoint.clone())
        .accept(CONTROL_ALPN, control)
        .spawn();

    let mark_network_ready = {
        let network_ready = network_ready.clone();
        let home_relay_url = home_relay_url.clone();
        let app_handle = app_handle.clone();
        move |endpoint: &Endpoint| {
            if let Some(url) = endpoint_home_relay_url(endpoint) {
                if let Ok(mut guard) = home_relay_url.write() {
                    *guard = Some(url);
                }
            }
            network_ready.store(true, Ordering::SeqCst);
            if let Some(handle) = &app_handle {
                let _ = handle.emit_event("device-node-network-ready");
            }
        }
    };

    // No relay path to wait on — treat network as ready immediately.
    if matches!(relay_mode, RelayMode::Disabled) {
        mark_network_ready(&endpoint);
    } else {
        let online_endpoint = endpoint.clone();
        tokio::spawn(async move {
            online_endpoint.online().await;
            mark_network_ready(&online_endpoint);
        });
    }

    Ok(NodeRuntime { endpoint, router })
}
