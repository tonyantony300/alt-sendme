//! Registry of devices seen on the local network but not yet paired.
//!
//! Deliberately free of I/O — it consumes observations from `lan_discovery`, so
//! the state machine is testable without multicast, which CI often blocks.

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

/// How long an entry's identity is trusted before a sighting re-probes it.
/// Names are pulled (`WhoAreYou` → `Identity`), never pushed — mDNS carries only
/// ids, so asking again is the only way to notice a rename.
pub const NEARBY_IDENTITY_REFRESH_MS: u64 = 60_000;

/// What the caller should do after an observation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ObserveOutcome {
    /// New unpaired peer — run the identity probe.
    ProbeNeeded,
    /// Already tracked, but the identity we hold is older than
    /// [`NEARBY_IDENTITY_REFRESH_MS`] — probe again, without announcing it as
    /// a new arrival.
    RefreshNeeded,
    /// Already tracked and recently probed; do nothing.
    Known,
    /// Already a paired device; Nearby ignores it and normal presence applies.
    Paired,
    /// Endpoint id was not a 64-character hex string.
    Invalid,
}

/// Fingerprint for logging. Malformed ids arrive from the network, so this must
/// never panic or echo the raw value into the log.
fn fingerprint_or_invalid(endpoint_id: &str) -> String {
    short_fingerprint(endpoint_id).unwrap_or_else(|| "invalid".to_string())
}

/// A registry entry: the device as the UI sees it, plus the probe bookkeeping
/// that never leaves this module.
#[derive(Debug, Clone)]
struct TrackedDevice {
    device: NearbyDevice,
    /// When the last probe was *started*, not answered — so a peer that never
    /// answers retries at the same cadence instead of on every sighting.
    last_probe_at: u64,
}

#[derive(Debug, Default)]
pub struct NearbyRegistry {
    /// `BTreeMap` so `list()` is ordered and the UI doesn't reshuffle rows.
    devices: BTreeMap<String, TrackedDevice>,
}

impl NearbyRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    /// Logs the outcome of every sighting — a wrapper covers `observe_inner`'s
    /// five exit paths at once. `now_ms` is injected so the refresh cadence is
    /// testable without waiting out a minute.
    pub fn observe(
        &mut self,
        endpoint_id: &str,
        peer_is_paired: bool,
        now_ms: u64,
    ) -> ObserveOutcome {
        let outcome = self.observe_inner(endpoint_id, peer_is_paired, now_ms);
        tracing::debug!(
            target: "dashbeam::_events::nearby::observe",
            remote = %fingerprint_or_invalid(endpoint_id),
            ?outcome,
            tracked = self.devices.len(),
        );
        outcome
    }

    fn observe_inner(
        &mut self,
        endpoint_id: &str,
        peer_is_paired: bool,
        now_ms: u64,
    ) -> ObserveOutcome {
        let Some(fingerprint) = short_fingerprint(endpoint_id) else {
            return ObserveOutcome::Invalid;
        };
        if peer_is_paired {
            // Pairing can happen while a device sits in the list, so drop it.
            self.devices.remove(endpoint_id);
            return ObserveOutcome::Paired;
        }
        if let Some(tracked) = self.devices.get_mut(endpoint_id) {
            // mDNS re-announces roughly once a second; only re-ask for the name
            // once the one we hold is stale.
            if now_ms.saturating_sub(tracked.last_probe_at) < NEARBY_IDENTITY_REFRESH_MS {
                return ObserveOutcome::Known;
            }
            tracked.last_probe_at = now_ms;
            return ObserveOutcome::RefreshNeeded;
        }
        self.devices.insert(
            endpoint_id.to_string(),
            TrackedDevice {
                device: NearbyDevice {
                    endpoint_id: endpoint_id.to_string(),
                    fingerprint,
                    display_name: None,
                    device_type: None,
                    os: None,
                    identified: false,
                },
                last_probe_at: now_ms,
            },
        );
        ObserveOutcome::ProbeNeeded
    }

    /// `true` when this changed the entry — a first identity, or a rename.
    /// `false` covers a peer that expired while its probe was in flight and a
    /// refresh that confirmed what we held, so a re-probe doesn't wake the UI.
    ///
    /// `os` is `None` for "unknown"; normalizing an old-build peer's `""` reply
    /// is the caller's job.
    pub fn set_identity(
        &mut self,
        endpoint_id: &str,
        display_name: String,
        device_type: String,
        os: Option<String>,
    ) -> bool {
        // `display_name` is user-authored and these logs end up in bug reports,
        // so log only its presence.
        tracing::debug!(
            target: "dashbeam::_events::nearby::identity",
            remote = %fingerprint_or_invalid(endpoint_id),
            device_type = %device_type,
            os = os.as_deref().unwrap_or("unknown"),
            tracked = self.devices.contains_key(endpoint_id),
        );
        let Some(tracked) = self.devices.get_mut(endpoint_id) else {
            return false;
        };
        let device = &mut tracked.device;
        let changed = !device.identified
            || device.display_name.as_deref() != Some(display_name.as_str())
            || device.device_type.as_deref() != Some(device_type.as_str())
            || device.os != os;
        device.display_name = Some(display_name);
        device.device_type = Some(device_type);
        device.os = os;
        device.identified = true;
        changed
    }

    /// Returns `true` if a device was actually removed.
    pub fn expire(&mut self, endpoint_id: &str) -> bool {
        let removed = self.devices.remove(endpoint_id).is_some();
        tracing::debug!(
            target: "dashbeam::_events::nearby::expire",
            remote = %fingerprint_or_invalid(endpoint_id),
            removed,
            tracked = self.devices.len(),
        );
        removed
    }

    pub fn list(&self) -> Vec<NearbyDevice> {
        self.devices
            .values()
            .map(|tracked| tracked.device.clone())
            .collect()
    }

    pub fn clear(&mut self) {
        tracing::debug!(
            target: "dashbeam::_events::nearby::clear",
            dropped = self.devices.len(),
        );
        self.devices.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn id(byte: &str) -> String {
        byte.repeat(32)
    }

    /// Fixed "now" for tests that don't care about the clock.
    const T0: u64 = 1_700_000_000_000;

    #[test]
    fn first_sighting_requests_a_probe_and_lists_unidentified() {
        let mut reg = NearbyRegistry::new();
        assert_eq!(
            reg.observe(&id("aa"), false, T0),
            ObserveOutcome::ProbeNeeded
        );

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
        reg.observe(&id("aa"), false, T0);
        assert_eq!(
            reg.observe(&id("aa"), false, T0 + NEARBY_IDENTITY_REFRESH_MS - 1),
            ObserveOutcome::Known
        );
        assert_eq!(reg.list().len(), 1);
    }

    /// Names are pulled, never pushed, so a peer that renames itself is only
    /// noticed by asking again — see [`NEARBY_IDENTITY_REFRESH_MS`].
    #[test]
    fn a_stale_sighting_asks_the_peer_who_it_is_again() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("aa"), false, T0);
        reg.set_identity(
            &id("aa"),
            "Old Name".to_string(),
            "laptop".to_string(),
            Some("macos".to_string()),
        );

        assert_eq!(
            reg.observe(&id("aa"), false, T0 + NEARBY_IDENTITY_REFRESH_MS),
            ObserveOutcome::RefreshNeeded,
            "a sighting past the refresh interval must re-probe"
        );
        assert_eq!(
            reg.list().len(),
            1,
            "re-probing must not duplicate or drop the row"
        );

        // The peer answers with its new name.
        assert!(reg.set_identity(
            &id("aa"),
            "New Name".to_string(),
            "laptop".to_string(),
            Some("macos".to_string()),
        ));
        assert_eq!(reg.list()[0].display_name.as_deref(), Some("New Name"));
    }

    /// The refresh cadence is paced off the last *attempt*, so the seconds of
    /// sightings that follow one don't each trigger their own probe.
    #[test]
    fn a_refresh_restarts_the_interval_even_if_the_probe_never_answers() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("aa"), false, T0);
        assert_eq!(
            reg.observe(&id("aa"), false, T0 + NEARBY_IDENTITY_REFRESH_MS),
            ObserveOutcome::RefreshNeeded
        );
        // No set_identity: the probe timed out or the peer refused it.
        assert_eq!(
            reg.observe(&id("aa"), false, T0 + NEARBY_IDENTITY_REFRESH_MS + 1),
            ObserveOutcome::Known,
            "the next sighting must not stack a second probe"
        );
    }

    /// A re-probe that confirms what we already hold must stay silent, or the
    /// UI would refetch the whole list once per interval per device.
    #[test]
    fn an_unchanged_identity_reports_no_change() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("aa"), false, T0);
        assert!(
            reg.set_identity(
                &id("aa"),
                "Same".to_string(),
                "laptop".to_string(),
                Some("macos".to_string()),
            ),
            "the first identity is a change"
        );
        assert!(
            !reg.set_identity(
                &id("aa"),
                "Same".to_string(),
                "laptop".to_string(),
                Some("macos".to_string()),
            ),
            "re-confirming the same identity is not"
        );
    }

    #[test]
    fn paired_peers_are_never_listed_as_nearby() {
        let mut reg = NearbyRegistry::new();
        assert_eq!(reg.observe(&id("bb"), true, T0), ObserveOutcome::Paired);
        assert!(reg.list().is_empty());
    }

    #[test]
    fn a_peer_that_becomes_paired_drops_out_of_the_list() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("cc"), false, T0);
        assert_eq!(reg.list().len(), 1);
        assert_eq!(reg.observe(&id("cc"), true, T0), ObserveOutcome::Paired);
        assert!(reg.list().is_empty(), "pairing must remove it from Nearby");
    }

    #[test]
    fn set_identity_fills_fields_and_marks_identified() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("dd"), false, T0);
        assert!(reg.set_identity(
            &id("dd"),
            "Tony's MacBook".to_string(),
            "laptop".to_string(),
            Some("macos".to_string()),
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
            Some("linux".to_string()),
        ));
        assert!(reg.list().is_empty());
    }

    #[test]
    fn set_identity_with_none_os_leaves_it_unset() {
        // Normalizing an old-build peer's `""` reply is the caller's job; this
        // only proves the registry stores whatever it's given.
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("11"), false, T0);
        assert!(reg.set_identity(
            &id("11"),
            "Old Build".to_string(),
            "laptop".to_string(),
            None,
        ));

        let listed = reg.list();
        assert!(listed[0].identified);
        assert_eq!(listed[0].os, None);
    }

    #[test]
    fn a_failed_probe_leaves_the_device_listed_but_unidentified() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("ff"), false, T0);
        // No set_identity call — the probe timed out or the peer is an old build.
        let listed = reg.list();
        assert_eq!(listed.len(), 1, "must remain sendable, not disappear");
        assert!(!listed[0].identified);
    }

    #[test]
    fn expire_removes_a_known_peer() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("aa"), false, T0);
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
        assert_eq!(reg.observe("not-hex", false, T0), ObserveOutcome::Invalid);
        assert_eq!(reg.observe("", false, T0), ObserveOutcome::Invalid);
        assert!(reg.list().is_empty());
    }

    #[test]
    fn list_is_sorted_by_endpoint_id_for_stable_ui_ordering() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("cc"), false, T0);
        reg.observe(&id("aa"), false, T0);
        reg.observe(&id("bb"), false, T0);
        let ids: Vec<_> = reg.list().into_iter().map(|d| d.endpoint_id).collect();
        assert_eq!(ids, vec![id("aa"), id("bb"), id("cc")]);
    }

    #[test]
    fn clear_empties_the_registry() {
        let mut reg = NearbyRegistry::new();
        reg.observe(&id("aa"), false, T0);
        reg.clear();
        assert!(reg.list().is_empty());
    }
}
