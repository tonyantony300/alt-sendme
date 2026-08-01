//! Shared policy for local-network discovery.
//!
//! Every decision here is a pure function so it can be tested without a socket.
//! The mDNS machinery lives in `native::lan_discovery`.

use crate::control::ControlMessage;
use serde::{Deserialize, Serialize};

/// Who may learn this device's human-readable identity over the local network.
///
/// Note what this does **not** control: mDNS publishes our node id and addresses
/// whenever it runs at all, so `PairedOnly` hides our *name*, not our *presence*.
/// Only `Off` stops the broadcast. `Off` stays asymmetric — we can still discover
/// and send to others, matching AirDrop.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Discoverability {
    #[default]
    Everyone,
    PairedOnly,
    Off,
}

/// Whether to answer a peer's `WhoAreYou`.
pub fn should_answer_identity(setting: Discoverability, peer_is_paired: bool) -> bool {
    match setting {
        Discoverability::Everyone => true,
        Discoverability::PairedOnly => peer_is_paired,
        Discoverability::Off => false,
    }
}

/// Whether to register the mDNS publisher at all.
pub fn should_publish_mdns(setting: Discoverability) -> bool {
    !matches!(setting, Discoverability::Off)
}

/// Whether to accept an inbound control connection from a peer we have not
/// paired with. Only `Everyone` does — under the other settings we would refuse
/// to answer anyway, so the connection has no legitimate purpose.
///
/// This setting check is necessary but not sufficient: `Everyone` is a *local
/// network* affordance, yet the endpoint is reachable from the whole internet
/// via the relay. The native accept gate (`node::PairedOnlyHook`) therefore
/// additionally requires an unpaired connection to present a direct (non-relay)
/// path, and unpaired messages are rate-limited per endpoint id
/// (`native::rate_limit`). Paired peers are exempt from both — their presence
/// connections legitimately run relay-only.
pub fn allows_unpaired_control(setting: Discoverability) -> bool {
    matches!(setting, Discoverability::Everyone)
}

/// Messages an *unpaired* peer is permitted to send over the control ALPN.
///
/// Defence in depth: the handshake gate decides whether to accept the connection
/// at all, and this decides what may be sent across it. Pairing votes,
/// recognition, and forget all presuppose an established relationship, so an
/// unpaired peer sending one is either buggy or hostile — drop the connection.
///
/// `InviteResponse` is allowed too: a nearby invite's sender has no
/// `PairedDevice` record for the receiver either, so the receiver's
/// accept/decline necessarily arrives over an unpaired connection. The
/// message-level allowance only says the *shape* is legitimate — the caller
/// still must not act on an `InviteResponse` from an unpaired peer unless it
/// matches an outstanding nearby invite that peer was actually sent, or any
/// unpaired stranger could spoof an acceptance.
pub fn unpaired_message_allowed(msg: &ControlMessage) -> bool {
    matches!(
        msg,
        ControlMessage::WhoAreYou
            | ControlMessage::Invite { .. }
            | ControlMessage::InviteResponse { .. }
            | ControlMessage::PairRequest { .. }
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::control::ControlMessage;

    #[test]
    fn everyone_answers_all_probes() {
        assert!(should_answer_identity(Discoverability::Everyone, false));
        assert!(should_answer_identity(Discoverability::Everyone, true));
    }

    #[test]
    fn paired_only_answers_only_known_peers() {
        assert!(!should_answer_identity(Discoverability::PairedOnly, false));
        assert!(should_answer_identity(Discoverability::PairedOnly, true));
    }

    #[test]
    fn off_answers_nobody() {
        assert!(!should_answer_identity(Discoverability::Off, false));
        assert!(!should_answer_identity(Discoverability::Off, true));
    }

    #[test]
    fn only_off_stops_publishing() {
        assert!(should_publish_mdns(Discoverability::Everyone));
        assert!(should_publish_mdns(Discoverability::PairedOnly));
        assert!(!should_publish_mdns(Discoverability::Off));
    }

    #[test]
    fn only_everyone_accepts_unpaired_control_connections() {
        assert!(allows_unpaired_control(Discoverability::Everyone));
        assert!(!allows_unpaired_control(Discoverability::PairedOnly));
        assert!(!allows_unpaired_control(Discoverability::Off));
    }

    #[test]
    fn unpaired_peers_may_probe_invite_pair_and_respond() {
        assert!(unpaired_message_allowed(&ControlMessage::WhoAreYou));
        assert!(unpaired_message_allowed(&ControlMessage::Invite {
            blob_ticket: "t".to_string(),
            file_count: 1,
            total_size: 10,
            sender_name: "s".to_string(),
        }));
        assert!(unpaired_message_allowed(&ControlMessage::InviteResponse {
            session_id: String::new(),
            response: crate::control::InviteResponse::Accepted,
        }));
        assert!(unpaired_message_allowed(&ControlMessage::InviteResponse {
            session_id: String::new(),
            response: crate::control::InviteResponse::Declined,
        }));
        assert!(unpaired_message_allowed(&ControlMessage::PairRequest {
            sender_name: "Alice".to_string(),
            device_type: "laptop".to_string(),
            os: "macos".to_string(),
        }));
    }

    #[test]
    fn unpaired_peers_may_not_use_relationship_messages() {
        assert!(!unpaired_message_allowed(&ControlMessage::Forget {
            signature: "sig".to_string(),
        }));
        assert!(!unpaired_message_allowed(&ControlMessage::Recognition {
            signature: "sig".to_string(),
        }));
        assert!(!unpaired_message_allowed(&ControlMessage::PairingInfo {
            endpoint_id: "aa".repeat(32),
            display_name: "n".to_string(),
            device_type: "laptop".to_string(),
            os: "macos".to_string(),
            signature: "sig".to_string(),
        }));
    }

    #[test]
    fn default_is_everyone() {
        assert_eq!(Discoverability::default(), Discoverability::Everyone);
    }

    #[test]
    fn serializes_kebab_case_for_the_frontend() {
        assert_eq!(
            serde_json::to_string(&Discoverability::PairedOnly).unwrap(),
            "\"paired-only\""
        );
    }
}
