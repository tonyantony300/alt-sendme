use std::collections::{HashMap, HashSet};
use std::path::Path;
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
    should_answer_identity, sign_challenge, unpaired_message_allowed, verify_challenge,
    write_message, AddrInfoOptions, AppHandle, ControlMessage, Discoverability,
    DiscoveryModeOption, InviteResponse, PairedDevice, PairingStatus, RememberVote, CONTROL_ALPN,
    PRESENCE_CONNECT_TIMEOUT_SECS,
};
use tokio::sync::{Mutex, RwLock};
use tokio::task::JoinHandle;
use tracing::debug;

use crate::device_identity::{
    load_or_create_identity, DeviceIdentity, DeviceInfo, PairedDeviceInfo, PairedDeviceStore,
};
use crate::paired_connections::{invite_wait_timeout, PairedConnectionManager};
use crate::pairing_util::{build_control_connect_addr, set_presence};
use crate::runtime::NodeRuntime;

#[derive(Debug)]
pub(crate) struct AccessState {
    pub(crate) allowed: HashSet<EndpointId>,
    pub(crate) pairing_host_open: bool,
    pub(crate) discoverability: Discoverability,
}

#[derive(Debug)]
struct PairedOnlyHook {
    access: Arc<RwLock<AccessState>>,
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
                .handle_paired_control_message(&remote, &keying, msg)
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
        })
    }

    pub async fn shutdown(&self) -> anyhow::Result<()> {

        self.stop_pairing_host().await;
        if let Some(handle) = self.connections_supervisor.lock().await.take() {
            handle.abort();

        }
        self.paired_connections.shutdown().await;
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
        {
            let current_relay = self.relay_mode.lock().await;
            let current_discovery = self.discovery_mode.lock().await;
            if format!("{current_relay:?}") == format!("{relay_mode:?}")
                && format!("{current_discovery:?}") == format!("{discovery_mode:?}")
            {
                return Ok(());
            }
        }

        self.stop_pairing_host().await;

        self.network_ready.store(false, Ordering::SeqCst);
        if let Some(handle) = &self.app_handle {
            let _ = handle.emit_event("device-node-network-warming");
        }

        let mut runtime = self.runtime.lock().await;
        runtime.router.shutdown().await?;
        runtime.endpoint.close().await;

        let new_runtime = build_runtime(
            self.identity.clone(),
            self.paired_store.clone(),
            self.access.clone(),
            self.pairing_host_persistent.clone(),
            self.app_handle.clone(),
            self.presence.clone(),
            self.paired_connections.clone(),
            self.network_ready.clone(),
            relay_mode.clone(),
            discovery_mode.clone(),
        )
        .await?;

        *runtime = new_runtime;
        self.paired_connections.refresh().await;
        *self.relay_mode.lock().await = relay_mode;
        *self.discovery_mode.lock().await = discovery_mode;

        Ok(())
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

        let stored_relay = self
            .paired_store
            .get(remote_endpoint_id)?
            .and_then(|d| d.relay_url);

        let conn = match self
            .paired_connections
            .wait_for_connection(remote_endpoint_id, invite_wait_timeout())
            .await
        {
            Some(conn) => {

                conn
            }
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
                        let now = protocol::identity::unix_now_ms();
                        let _ = self.paired_store.touch(remote_endpoint_id, now);
                        set_presence(
                            &self.presence,
                            &self.app_handle,
                            &self.paired_store,
                            remote_endpoint_id,
                            true,
                        );
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
        let response = if accepted {
            InviteResponse::Accepted
        } else {
            InviteResponse::Declined
        };
        let access = self.access.read().await;
        let in_allowlist = access.allowed.contains(&remote);
        drop(access);
        if !in_allowlist {

            anyhow::bail!("unknown paired device");
        }

        let stored_relay = self
            .paired_store
            .get(remote_endpoint_id)?
            .and_then(|d| d.relay_url);

        let conn = match self
            .paired_connections
            .wait_for_connection(remote_endpoint_id, invite_wait_timeout())
            .await
        {
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
        let _ = send.finish();

        Ok(())
    }

    pub async fn set_discoverability(&self, setting: Discoverability) {
        self.access.write().await.discoverability = setting;
    }

    pub async fn discoverability(&self) -> Discoverability {
        self.access.read().await.discoverability
    }

    /// Dial a peer's control ALPN and ask who it is. Used for devices found on
    /// the local network, where mDNS supplies a node id and nothing else.
    pub async fn probe_identity(&self, endpoint_id: &str) -> anyhow::Result<DeviceInfo> {
        let remote: EndpointId = endpoint_id.parse()?;
        let endpoint = {
            let runtime = self.runtime.lock().await;
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
