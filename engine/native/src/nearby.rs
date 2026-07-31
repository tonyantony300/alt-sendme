//! Registry of devices seen on the local network but not yet paired.
//!
//! Deliberately free of I/O. It consumes observations that `lan_discovery`
//! feeds it, which is what lets the whole state machine be tested without
//! multicast — CI runners frequently block it.

use protocol::identity::short_fingerprint;
use serde::Serialize;
use std::collections::BTreeMap;

/// A device seen on the local network. `display_name` and friends are `None`
/// until the identity probe answers, and may stay `None` forever if the peer
/// is an older build or refuses to answer.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NearbyDevice {
    pub endpoint_id: String,
    /// Rendered identically on every platform. See `short_fingerprint`.
    pub fingerprint: String,
    pub display_name: Option<String>,
    pub device_type: Option<String>,
    pub os: Option<String>,
    pub identified: bool,
}

/// What the caller should do after an observation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ObserveOutcome {
    /// New unpaired peer — run the identity probe.
    ProbeNeeded,
    /// Already tracked; do nothing.
    Known,
    /// Already a paired device; Nearby ignores it and normal presence applies.
    Paired,
    /// Endpoint id was not a 64-character hex string.
    Invalid,
}

#[derive(Debug, Default)]
pub struct NearbyRegistry {
    /// `BTreeMap` so `list()` is ordered without an explicit sort, which keeps
    /// the UI from reshuffling rows on every discovery event.
    devices: BTreeMap<String, NearbyDevice>,
}

impl NearbyRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn observe(&mut self, endpoint_id: &str, peer_is_paired: bool) -> ObserveOutcome {
        let Some(fingerprint) = short_fingerprint(endpoint_id) else {
            return ObserveOutcome::Invalid;
        };
        if peer_is_paired {
            // Pairing can happen while a device sits in the list, so drop it.
            self.devices.remove(endpoint_id);
            return ObserveOutcome::Paired;
        }
        if self.devices.contains_key(endpoint_id) {
            return ObserveOutcome::Known;
        }
        self.devices.insert(
            endpoint_id.to_string(),
            NearbyDevice {
                endpoint_id: endpoint_id.to_string(),
                fingerprint,
                display_name: None,
                device_type: None,
                os: None,
                identified: false,
            },
        );
        ObserveOutcome::ProbeNeeded
    }

    /// Returns `false` if the peer is not tracked, which happens when it expires
    /// while its probe is still in flight.
    pub fn set_identity(
        &mut self,
        endpoint_id: &str,
        display_name: String,
        device_type: String,
        os: String,
    ) -> bool {
        let Some(device) = self.devices.get_mut(endpoint_id) else {
            return false;
        };
        device.display_name = Some(display_name);
        device.device_type = Some(device_type);
        device.os = Some(os);
        device.identified = true;
        true
    }

    /// Returns `true` if a device was actually removed.
    pub fn expire(&mut self, endpoint_id: &str) -> bool {
        self.devices.remove(endpoint_id).is_some()
    }

    pub fn list(&self) -> Vec<NearbyDevice> {
        self.devices.values().cloned().collect()
    }

    pub fn clear(&mut self) {
        self.devices.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn id(byte: &str) -> String {
        byte.repeat(32)
    }

    #[test]
    fn first_sighting_requests_a_probe_and_lists_unidentified() {
        let mut reg = NearbyRegistry::new();
        assert_eq!(reg.observe(&id("aa"), false), ObserveOutcome::ProbeNeeded);

        let listed = reg.list();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].endpoint_id, id("aa"));
        assert!(!listed[0].identified);
        assert_eq!(listed[0].display_name, None);
        assert!(!listed[0].fingerprint.is_empty());
    }

    #[test]
    fn repeat_sighting_does_not_reprobe_or_duplicate() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("aa"), false);
        assert_eq!(reg.observe(&id("aa"), false), ObserveOutcome::Known);
        assert_eq!(reg.list().len(), 1);
    }

    #[test]
    fn paired_peers_are_never_listed_as_nearby() {
        let mut reg = NearbyRegistry::new();
        assert_eq!(reg.observe(&id("bb"), true), ObserveOutcome::Paired);
        assert!(reg.list().is_empty());
    }

    #[test]
    fn a_peer_that_becomes_paired_drops_out_of_the_list() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("cc"), false);
        assert_eq!(reg.list().len(), 1);
        assert_eq!(reg.observe(&id("cc"), true), ObserveOutcome::Paired);
        assert!(reg.list().is_empty(), "pairing must remove it from Nearby");
    }

    #[test]
    fn set_identity_fills_fields_and_marks_identified() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("dd"), false);
        assert!(reg.set_identity(
            &id("dd"),
            "Tony's MacBook".to_string(),
            "laptop".to_string(),
            "macos".to_string(),
        ));

        let listed = reg.list();
        assert!(listed[0].identified);
        assert_eq!(listed[0].display_name.as_deref(), Some("Tony's MacBook"));
        assert_eq!(listed[0].device_type.as_deref(), Some("laptop"));
        assert_eq!(listed[0].os.as_deref(), Some("macos"));
    }

    #[test]
    fn set_identity_on_unknown_peer_is_ignored() {
        let mut reg = NearbyRegistry::new();
        assert!(!reg.set_identity(
            &id("ee"),
            "Ghost".to_string(),
            "laptop".to_string(),
            "linux".to_string(),
        ));
        assert!(reg.list().is_empty());
    }

    #[test]
    fn a_failed_probe_leaves_the_device_listed_but_unidentified() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("ff"), false);
        // No set_identity call — the probe timed out or the peer is an old build.
        let listed = reg.list();
        assert_eq!(listed.len(), 1, "must remain sendable, not disappear");
        assert!(!listed[0].identified);
    }

    #[test]
    fn expire_removes_a_known_peer() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("aa"), false);
        assert!(reg.expire(&id("aa")));
        assert!(reg.list().is_empty());
    }

    #[test]
    fn expire_on_unknown_peer_reports_no_change() {
        let mut reg = NearbyRegistry::new();
        assert!(!reg.expire(&id("aa")));
    }

    #[test]
    fn malformed_endpoint_ids_are_rejected() {
        let mut reg = NearbyRegistry::new();
        assert_eq!(reg.observe("not-hex", false), ObserveOutcome::Invalid);
        assert_eq!(reg.observe("", false), ObserveOutcome::Invalid);
        assert!(reg.list().is_empty());
    }

    #[test]
    fn list_is_sorted_by_endpoint_id_for_stable_ui_ordering() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("cc"), false);
        reg.observe(&id("aa"), false);
        reg.observe(&id("bb"), false);
        let ids: Vec<_> = reg.list().into_iter().map(|d| d.endpoint_id).collect();
        assert_eq!(ids, vec![id("aa"), id("bb"), id("cc")]);
    }

    #[test]
    fn clear_empties_the_registry() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("aa"), false);
        reg.clear();
        assert!(reg.list().is_empty());
    }
}
