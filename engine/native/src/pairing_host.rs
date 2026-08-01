//! Pairing-code host and join flows.
//!
//! Split out of `node.rs` to keep that file navigable as local-network
//! discovery lands. Behaviour is unchanged — this was a move, not a rewrite.

use std::str::FromStr;
use std::sync::atomic::Ordering;
use std::time::Duration;

use anyhow::Context;
use iroh::{EndpointAddr, EndpointId, TransportAddr};
use protocol::{
    export_connection_keying_material, read_message, sign_challenge, verify_challenge,
    write_message, ControlMessage, PairedDevice, PairingStatus, RememberVote, CONTROL_ALPN,
};
use tracing::debug;

use super::node::NodeService;

impl NodeService {
    pub async fn start_pairing_host(&self, ttl_secs: Option<u64>) -> anyhow::Result<String> {
        debug!(
            target: "dashbeam::_events::pairing::host_open",
            ttl_secs = ?ttl_secs,
        );

        self.stop_pairing_host().await;

        let persistent = protocol::pairing::pairing_host_is_persistent(ttl_secs);
        self.pairing_host_persistent
            .store(persistent, Ordering::SeqCst);
        self.pairing_host_open.store(true, Ordering::SeqCst);
        self.access.write().await.pairing_host_open = true;

        if let Some(ttl) = ttl_secs {
            let access = self.access.clone();
            let flag = self.pairing_host_open.clone();
            let persistent_flag = self.pairing_host_persistent.clone();
            let app_handle = self.app_handle.clone();
            let handle = tokio::spawn(async move {
                tokio::time::sleep(Duration::from_secs(ttl)).await;
                flag.store(false, Ordering::SeqCst);
                persistent_flag.store(false, Ordering::SeqCst);
                access.write().await.pairing_host_open = false;

                if let Some(handle) = &app_handle {

                    let _ = handle.emit_event("pairing-host-expired");
                }
            });
            *self.pairing_expire_task.lock().await = Some(handle);
        }

        let ticket = self.pairing_ticket()?;

        Ok(ticket)
    }

    pub async fn stop_pairing_host(&self) {
        if let Some(handle) = self.pairing_expire_task.lock().await.take() {
            handle.abort();

        }
        self.pairing_host_persistent.store(false, Ordering::SeqCst);
        let was_open = self.pairing_host_open.swap(false, Ordering::SeqCst);
        self.access.write().await.pairing_host_open = false;
        let _ = was_open;
    }

    pub async fn join_pairing(&self, ticket_str: &str) -> anyhow::Result<()> {
        let ticket = protocol::PairingTicket::decode(ticket_str).inspect_err(|error| {
            debug!(
                target: "dashbeam::_events::pairing::join_failed",
                stage = "decode_ticket",
                %error,
            );
        })?;
        let remote = EndpointId::from_str(&ticket.endpoint_id)?;
        debug!(
            target: "dashbeam::_events::pairing::join_attempt",
            remote = %remote.fmt_short(),
            has_relay = ticket.relay_url.is_some(),
        );

        let host_relay_url = ticket.relay_url.clone();
        let mut addr = EndpointAddr::from(remote);
        if let Some(relay) = host_relay_url.as_deref() {
            if let Ok(url) = relay.parse() {
                addr.addrs.insert(TransportAddr::Relay(url));

            }
        }

        let endpoint = {
            let runtime = self.runtime.lock().await;
            runtime.endpoint.clone()
        };
        let conn = match endpoint.connect(addr, CONTROL_ALPN).await {
            Ok(conn) => conn,
            Err(err) => {
                return Err(err).context("pairing connect failed");
            }
        };

        let keying = export_connection_keying_material(&conn)?;

        let (mut send, mut recv) = conn.open_bi().await.context("open bi stream for join")?;

        // Send first so the host can accept_bi and begin its side of the handshake.
        let info = ControlMessage::PairingInfo {
            endpoint_id: self.identity.endpoint_id(),
            display_name: self.identity.display_name(),
            device_type: self.identity.device_type(),
            os: self.identity.os(),
            signature: sign_challenge(&self.identity.secret_key, &keying),
        };
        write_message(&mut send, &info)
            .await
            .context("write local PairingInfo")?;

        let vote = ControlMessage::RememberVote {
            session_id: uuid::Uuid::new_v4().to_string(),
            vote: RememberVote::Remember,
        };
        write_message(&mut send, &vote)
            .await
            .context("write RememberVote")?;

        let host_info = match read_message(&mut recv).await {
            Ok(msg) => msg,
            Err(err) => {

                return Err(err).context("read host PairingInfo");
            }
        };

        let ControlMessage::PairingInfo {
            endpoint_id,
            display_name,
            device_type,
            os,
            signature,
        } = host_info
        else {

            anyhow::bail!("expected host PairingInfo");
        };
        let peer_id = EndpointId::from_str(&endpoint_id).context("invalid host endpoint id")?;
        if !verify_challenge(&peer_id, &keying, &signature) {
            anyhow::bail!("host PairingInfo signature invalid");
        }

        let now = protocol::identity::unix_now_ms();
        self.paired_store.remember(PairedDevice {
            endpoint_id: endpoint_id.clone(),
            display_name: display_name.clone(),
            device_type,
            os,
            paired_at: now,
            last_seen_at: now,
            relay_url: host_relay_url.clone(),
            pairing_status: PairingStatus::Active,
        })?;
        self.access.write().await.allowed.insert(peer_id);
        self.paired_connections.refresh().await;

        crate::pairing_util::emit_device_paired(&self.app_handle, &display_name);

        Ok(())
    }
}
