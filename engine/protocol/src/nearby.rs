//! Shared policy for local-network discovery.
//!
//! Every decision here is a pure function so it can be tested without a socket.
//! The mDNS machinery lives in `native::lan_discovery`.

use crate::control::ControlMessage;
use serde::{Deserialize, Serialize};

/// Who may learn this device's human-readable identity over the local network.
/// mDNS publishes our node id and addresses whenever it runs, so `PairedOnly`
/// hides our name, not our presence — only `Off` stops the broadcast. `Off` is
/// asymmetric: we can still discover and send to others, matching AirDrop.
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

/// Whether this device has presence worth keeping alive off screen — the gate
/// for Android's foreground service. Wider than [`should_publish_mdns`]: paired
/// presence rides the control connections, which keep running under `Off`.
pub fn should_run_background_presence(paired_count: usize, setting: Discoverability) -> bool {
    paired_count > 0 || should_publish_mdns(setting)
}

/// Whether to accept an inbound control connection from an unpaired peer. Only
/// `Everyone` does. Necessary but not sufficient: the endpoint is reachable over
/// the relay from anywhere, so `node::PairedOnlyHook` also requires a direct
/// path and `native::rate_limit` throttles the messages. Paired peers are exempt.
pub fn allows_unpaired_control(setting: Discoverability) -> bool {
    matches!(setting, Discoverability::Everyone)
}

/// Messages an unpaired peer may send over the control ALPN. Pairing votes,
/// recognition and forget all presuppose a relationship, so sending one is
/// buggy or hostile.
///
/// `InviteResponse` is allowed because a nearby accept/decline necessarily
/// arrives over an unpaired connection — but the caller must still match it
/// against an invite actually sent, or a stranger could spoof an acceptance.
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
    fn background_presence_runs_while_any_device_is_paired() {
        // Paired presence rides control connections, not mDNS.
        for setting in [
            Discoverability::Everyone,
            Discoverability::PairedOnly,
            Discoverability::Off,
        ] {
            assert!(should_run_background_presence(1, setting));
        }
    }

    #[test]
    fn background_presence_runs_while_discoverable_without_pairs() {
        assert!(should_run_background_presence(0, Discoverability::Everyone));
        assert!(should_run_background_presence(0, Discoverability::PairedOnly));
    }

    #[test]
    fn background_presence_idles_with_nothing_to_maintain() {
        assert!(!should_run_background_presence(0, Discoverability::Off));
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
