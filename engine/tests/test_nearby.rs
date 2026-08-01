//! Nearby / local-network discovery E2E.
//!
//! These bind real endpoints, so run with `--test-threads=1`.

mod common;

use common::TestNode;
use engine::{Discoverability, DiscoveryModeOption};
use iroh::endpoint::RelayMode;
use std::time::Duration;

const PRESENCE_DEADLINE: Duration = Duration::from_secs(60);
const NETWORK_READY_DEADLINE: Duration = Duration::from_secs(30);

/// `node`'s view of whether `endpoint_id` is currently online. Used to detect
/// whether a probe connection clobbered the paired peer's real session.
fn is_online(node: &TestNode, endpoint_id: &str) -> bool {
    node.list_paired()
        .expect("list_paired")
        .into_iter()
        .find(|d| d.endpoint_id.eq_ignore_ascii_case(endpoint_id))
        .map(|d| d.online)
        .unwrap_or(false)
}

/// Polls `is_online` for `window`, failing on the first `false` seen.
/// A corrupted session doesn't necessarily flip presence the instant a probe
/// completes — the owning task only unregisters once it notices the probe
/// connection closed, which happens asynchronously. A single point-in-time
/// check after the probe can race past that; polling across a window can't.
async fn assert_stays_online(node: &TestNode, endpoint_id: &str, window: Duration) {
    let end = tokio::time::Instant::now() + window;
    while tokio::time::Instant::now() < end {
        assert!(
            is_online(node, endpoint_id),
            "presence flipped offline after the probe — the paired session was clobbered"
        );
        tokio::time::sleep(Duration::from_millis(200)).await;
    }
}

#[tokio::test]
async fn unpaired_peer_can_probe_identity_when_discoverable_to_everyone() {
    let alice = common::spawn_node("alice").await;
    let bob = common::spawn_node("bob").await;
    bob.set_discoverability(Discoverability::Everyone).await;

    let identity = alice
        .probe_identity(&bob.endpoint_id())
        .await
        .expect("probe should succeed");

    assert_eq!(identity.endpoint_id, bob.endpoint_id());
    assert_eq!(identity.display_name, "bob");
}

/// Unpaired control traffic is rate-limited per endpoint id (see
/// `native/src/rate_limit.rs`: burst of 8 messages, one token refilled every
/// 2 seconds): a stranger probing in a tight loop runs out of tokens and has
/// its connection closed instead of being served indefinitely.
#[tokio::test]
async fn unpaired_probe_loop_is_rate_limited() {
    let alice = common::spawn_node("alice").await;
    let bob = common::spawn_node("bob").await;
    bob.set_discoverability(Discoverability::Everyone).await;

    // Well past the burst allowance. Localhost probes complete in far under
    // the 2s-per-token refill interval, so the loop must outrun the refill.
    let mut denied = false;
    for _ in 0..20 {
        if alice.probe_identity(&bob.endpoint_id()).await.is_err() {
            denied = true;
            break;
        }
    }
    assert!(denied, "a probe loop must eventually be rate-limited");
}

#[tokio::test]
async fn unpaired_peer_is_refused_when_paired_only() {
    let alice = common::spawn_node("alice").await;
    let bob = common::spawn_node("bob").await;
    bob.set_discoverability(Discoverability::PairedOnly).await;

    assert!(
        alice.probe_identity(&bob.endpoint_id()).await.is_err(),
        "an unpaired peer must not learn our name under PairedOnly"
    );
}

#[tokio::test]
async fn unpaired_peer_is_refused_when_off() {
    let alice = common::spawn_node("alice").await;
    let bob = common::spawn_node("bob").await;
    bob.set_discoverability(Discoverability::Off).await;

    assert!(alice.probe_identity(&bob.endpoint_id()).await.is_err());
}

#[tokio::test]
async fn already_paired_peers_still_probe_under_paired_only() {
    let (alice, bob) = common::spawn_paired_nodes().await;
    bob.set_discoverability(Discoverability::PairedOnly).await;

    // Baseline: bob's persistent control connection to alice is up before we
    // send a probe down a separate, short-lived connection.
    common::wait_until(
        "bob to see alice online before probing",
        PRESENCE_DEADLINE,
        || is_online(&bob, &alice.endpoint_id()),
    )
    .await;

    let identity = alice
        .probe_identity(&bob.endpoint_id())
        .await
        .expect("paired peers must still resolve under PairedOnly");
    assert_eq!(identity.display_name, "bob");

    assert_stays_online(&bob, &alice.endpoint_id(), Duration::from_secs(5)).await;
}

#[tokio::test]
async fn paired_peer_probe_refused_under_off_does_not_kill_session() {
    let (alice, bob) = common::spawn_paired_nodes().await;
    bob.set_discoverability(Discoverability::Off).await;

    common::wait_until(
        "bob to see alice online before probing",
        PRESENCE_DEADLINE,
        || is_online(&bob, &alice.endpoint_id()),
    )
    .await;

    assert!(
        alice.probe_identity(&bob.endpoint_id()).await.is_err(),
        "Off must refuse even an already-paired peer's probe"
    );

    assert!(
        is_online(&bob, &alice.endpoint_id()),
        "a refused probe must not tear down the paired peer's session"
    );
}

/// mDNS re-fires `Discovered` whenever a peer's advertised addrs change (and
/// on some stacks, often). For already-paired peers that maps to
/// `nudge_reconnect`. Nudging must *not* abort a live presence session —
/// otherwise nearby-paired devices (which stay on the LAN and keep
/// rediscovering) flap online/offline while code-paired peers that aren't
/// being rediscovered stay stable.
#[tokio::test]
async fn mdns_rediscovery_does_not_flap_paired_presence() {
    let (alice, bob) = common::spawn_paired_nodes().await;

    common::wait_until(
        "bob to see alice online before rediscovery nudges",
        PRESENCE_DEADLINE,
        || is_online(&bob, &alice.endpoint_id()),
    )
    .await;
    common::wait_until(
        "alice to see bob online before rediscovery nudges",
        PRESENCE_DEADLINE,
        || is_online(&alice, &bob.endpoint_id()),
    )
    .await;

    // Several rediscoveries in quick succession — mirrors what a chatty
    // mDNS republish looks like on a busy LAN.
    for _ in 0..5 {
        bob.simulate_paired_lan_appeared_for_tests(&alice.endpoint_id())
            .await;
        alice
            .simulate_paired_lan_appeared_for_tests(&bob.endpoint_id())
            .await;
    }

    assert_stays_online(&bob, &alice.endpoint_id(), Duration::from_secs(5)).await;
    assert_stays_online(&alice, &bob.endpoint_id(), Duration::from_secs(5)).await;
}

/// Even if the *peer* still runs the old "abort on every mDNS rediscovery"
/// behaviour, this device must keep showing them online — our outbound to
/// them is still alive, and their flapping inbound must not clear it.
#[tokio::test]
async fn peer_outbound_flaps_do_not_clear_our_presence() {
    let (alice, bob) = common::spawn_paired_nodes().await;

    common::wait_until(
        "bob to see alice online",
        PRESENCE_DEADLINE,
        || is_online(&bob, &alice.endpoint_id()),
    )
    .await;
    common::wait_until(
        "alice to see bob online",
        PRESENCE_DEADLINE,
        || is_online(&alice, &bob.endpoint_id()),
    )
    .await;

    // Alice is the unfixed peer: force-abort her outbound to bob repeatedly.
    for _ in 0..5 {
        alice
            .force_paired_reconnect_for_tests(&bob.endpoint_id())
            .await;
        tokio::time::sleep(Duration::from_millis(200)).await;
    }

    // Bob is the device under test — his view of alice must stay online.
    assert_stays_online(&bob, &alice.endpoint_id(), Duration::from_secs(5)).await;
}

/// Real multicast. CI runners frequently block it, so this is opt-in:
/// `cargo test --manifest-path engine/Cargo.toml --test test_nearby -- --ignored --test-threads=1`
#[tokio::test]
#[ignore = "requires multicast on the local network"]
async fn two_nodes_discover_each_other_over_mdns() {
    let alice = common::spawn_node_with_lan_discovery("alice").await;
    let bob = common::spawn_node_with_lan_discovery("bob").await;

    let found = common::wait_for_nearby(
        &alice,
        &bob.endpoint_id(),
        std::time::Duration::from_secs(20),
    )
    .await
    .expect("bob should appear in alice's nearby list");

    assert_eq!(found.endpoint_id, bob.endpoint_id());
    assert!(found.identified, "probe should have resolved the name");
    assert_eq!(found.display_name.as_deref(), Some("bob"));
    assert_eq!(found.fingerprint.len(), 14);
}

/// Regression coverage for the endpoint-rebuild fix: `Discoverability`
/// transitions across the `Off` boundary go through the same machinery as
/// `reconfigure_network` (close the endpoint, rebuild it, restart discovery
/// if applicable) rather than a lightweight toggle, because iroh 1.0.3 has no
/// way to unregister an address-lookup service or flip `advertise` on a live
/// `MdnsAddressLookup`. This doesn't need real multicast: it only exercises
/// that the rebuild completes and the node comes back online each time,
/// repeated to catch a stall or leak that only shows up on a second cycle.
#[tokio::test]
async fn discoverability_off_then_on_rebuilds_the_endpoint_repeatedly() {
    let node = common::spawn_node("solo").await;
    common::wait_until("network ready after start", NETWORK_READY_DEADLINE, || {
        node.is_network_ready()
    })
    .await;

    for _ in 0..2 {
        node.set_discoverability(Discoverability::Off).await;
        assert_eq!(node.discoverability().await, Discoverability::Off);
        assert!(
            node.list_nearby().await.is_empty(),
            "moving to Off must clear the nearby list"
        );
        common::wait_until(
            "network ready after moving to Off",
            NETWORK_READY_DEADLINE,
            || node.is_network_ready(),
        )
        .await;

        node.set_discoverability(Discoverability::Everyone).await;
        assert_eq!(node.discoverability().await, Discoverability::Everyone);
        common::wait_until(
            "network ready after leaving Off",
            NETWORK_READY_DEADLINE,
            || node.is_network_ready(),
        )
        .await;
    }
}

/// `Everyone` <-> `PairedOnly` must not touch mDNS state at all — no rebuild,
/// no network-warming blip.
#[tokio::test]
async fn paired_only_transition_does_not_rebuild_the_network() {
    let node = common::spawn_node("solo").await;
    common::wait_until("network ready after start", NETWORK_READY_DEADLINE, || {
        node.is_network_ready()
    })
    .await;

    node.set_discoverability(Discoverability::PairedOnly).await;
    assert_eq!(node.discoverability().await, Discoverability::PairedOnly);
    // Rebuilding briefly flips network_ready to false; since neither side of
    // this transition is Off, it must never have happened. No wait here is
    // deliberate: `set_discoverability` is awaited to completion above, and
    // if it had rebuilt the network this flag would already be false.
    assert!(node.is_network_ready());

    node.set_discoverability(Discoverability::Everyone).await;
    assert_eq!(node.discoverability().await, Discoverability::Everyone);
    assert!(node.is_network_ready());
}

/// Regression coverage for the concurrency fix: `set_discoverability` and
/// `reconfigure_network` both close and rebuild `runtime`/`lan_discovery`,
/// and before `network_transition` serialized them, two overlapping calls
/// could interleave their close/build steps (the second closing the endpoint
/// the first just built) and race which one's post-rebuild decision — start
/// discovery, clear the registry — actually stuck.
///
/// Firing both concurrently via `tokio::join!` genuinely interleaves their
/// polling (each has many `.await` points), so this exercises real
/// contention on `network_transition`, not just sequential calls. There's no
/// deterministic "winner" between two truly concurrent calls — the
/// assertions below only check the invariant the review demanded: whatever
/// the final state is, it's internally consistent and the node is still
/// usable afterward, not wedged or torn between two half-applied rebuilds.
#[tokio::test]
async fn concurrent_discoverability_toggle_and_reconfigure_settle_consistently() {
    let node = common::spawn_node("solo").await;
    common::wait_until("network ready after start", NETWORK_READY_DEADLINE, || {
        node.is_network_ready()
    })
    .await;

    let toggle = node.set_discoverability(Discoverability::Off);
    let reconfigure = node.reconfigure_network(RelayMode::Disabled, DiscoveryModeOption::Default);
    let (_, reconfigure_result) = tokio::join!(toggle, reconfigure);
    reconfigure_result
        .expect("reconfigure must not error just because it raced a discoverability change");

    common::wait_until(
        "network ready after the concurrent transitions settle",
        NETWORK_READY_DEADLINE,
        || node.is_network_ready(),
    )
    .await;

    // Internal consistency: if discoverability landed on Off, the registry
    // must actually be empty (not left populated by a competing rebuild that
    // started discovery after the clear — the exact staleness bug this fix
    // closes).
    if node.discoverability().await == Discoverability::Off {
        assert!(
            node.list_nearby().await.is_empty(),
            "Off must mean an empty nearby list, even after a race"
        );
    }

    // The node must still be fully functional afterward — a wedged endpoint
    // or a doubly-built one would typically show up as this hanging or
    // erroring.
    node.reconfigure_network(RelayMode::Default, DiscoveryModeOption::Default)
        .await
        .expect("node must still be reconfigurable after the race");
    common::wait_until(
        "network ready after the follow-up reconfigure",
        NETWORK_READY_DEADLINE,
        || node.is_network_ready(),
    )
    .await;
}

/// Real multicast — opt-in, see `two_nodes_discover_each_other_over_mdns`.
///
/// Regression test for the Critical finding: previously `Off` only aborted
/// the local consumer task and left the registered `MdnsAddressLookup`
/// advertising forever (its `advertise` flag is fixed at construction and
/// iroh 1.0.3 has no way to unregister it), so a peer that turned
/// discoverability off never actually stopped being visible over mDNS. This
/// asserts the peer that goes `Off` actually disappears from the other
/// side's Nearby list, not just that our own list clears locally.
#[tokio::test]
#[ignore = "requires multicast on the local network"]
async fn discoverability_off_stops_mdns_advertising() {
    let alice = common::spawn_node_with_lan_discovery("alice").await;
    let bob = common::spawn_node_with_lan_discovery("bob").await;

    common::wait_for_nearby(
        &bob,
        &alice.endpoint_id(),
        std::time::Duration::from_secs(20),
    )
    .await
    .expect("bob should discover alice before the Off toggle");

    alice.set_discoverability(Discoverability::Off).await;

    let vanished = common::wait_until_absent(
        &bob,
        &alice.endpoint_id(),
        std::time::Duration::from_secs(60),
    )
    .await;
    assert!(
        vanished,
        "alice must actually stop advertising once Off — bob should stop seeing her, \
         not just have her own local list clear"
    );
}

// The tests below exercise `invite_nearby_device`'s precondition —
// `endpoint_id` actually present in the caller's Nearby list — via
// `inject_nearby_device_for_tests` rather than real mDNS multicast, so they
// run in the default suite on any CI runner (unlike
// `two_nodes_discover_each_other_over_mdns`, which stays opt-in above).
// `NearbyRegistry` is pure state (see its module docs), so seeding it this
// way exercises exactly the same code `invite_nearby_device` checks against
// — only the socket is skipped.

#[tokio::test]
async fn accepting_a_nearby_invite_promotes_the_sender_to_paired() {
    let alice = common::spawn_node("alice").await;
    let bob = common::spawn_node("bob").await;
    bob.set_discoverability(Discoverability::Everyone).await;

    assert!(
        bob.list_paired().unwrap().is_empty(),
        "precondition: bob knows nobody"
    );

    alice
        .inject_nearby_device_for_tests(&bob.endpoint_id())
        .await;

    let delivered = alice
        .invite_nearby_device(&bob.endpoint_id(), "test-blob-ticket", 1, 12)
        .await
        .expect("invite should be delivered");
    assert!(delivered, "invite must report delivered");

    bob.accept_nearby_invite(&alice.endpoint_id())
        .await
        .expect("accept should succeed");

    let paired = bob.list_paired().unwrap();
    assert_eq!(paired.len(), 1, "accepting must create a paired record");
    assert_eq!(paired[0].endpoint_id, alice.endpoint_id());

    // The sender must observe the acceptance too — reusing the same
    // `paired-invite-response` event an already-paired device's accept
    // emits, per `emit_paired_invite_response`. Delivery is a fire-and-forget
    // dial from bob's side, so poll rather than assert immediately.
    common::wait_until(
        "alice to observe bob's acceptance",
        Duration::from_secs(15),
        || alice.events.has_event("paired-invite-response"),
    )
    .await;
    let responses = alice.events.events_with_name("paired-invite-response");
    assert_eq!(responses.len(), 1);
    let payload: serde_json::Value =
        serde_json::from_str(responses[0].payload.as_deref().unwrap()).unwrap();
    assert_eq!(payload["endpoint_id"], bob.endpoint_id());
    assert_eq!(payload["response"], "accepted");

    // Pairing must be mutual: without the sender also committing a paired
    // record for the responder, the responder's persistent presence
    // connection back to the sender gets rejected (their `Recognition` isn't
    // allowed from a peer that still considers them unpaired), so presence
    // would never establish in that direction.
    common::wait_until(
        "alice to also record bob as paired (mutual nearby pairing)",
        Duration::from_secs(15),
        || {
            alice
                .list_paired()
                .unwrap()
                .iter()
                .any(|d| d.endpoint_id == bob.endpoint_id())
        },
    )
    .await;
    let alice_paired = alice.list_paired().unwrap();
    assert_eq!(
        alice_paired.len(),
        1,
        "the sender must also record the responder as paired"
    );
    assert_eq!(alice_paired[0].endpoint_id, bob.endpoint_id());

    // A promoted device must not also appear under the sender's own Nearby
    // list, mirroring the receiver-side check in
    // `a_promoted_device_leaves_the_nearby_list`.
    assert!(
        !alice
            .list_nearby()
            .await
            .iter()
            .any(|d| d.endpoint_id == bob.endpoint_id()),
        "a promoted device must not also appear under the sender's Nearby list"
    );

    // Presence must actually establish in both directions, not just the
    // paired records existing — each side's `paired_connections` needs to
    // dial the other and have it accepted.
    common::wait_until(
        "alice to see bob online after mutual nearby pairing",
        PRESENCE_DEADLINE,
        || is_online(&alice, &bob.endpoint_id()),
    )
    .await;
    common::wait_until(
        "bob to see alice online after mutual nearby pairing",
        PRESENCE_DEADLINE,
        || is_online(&bob, &alice.endpoint_id()),
    )
    .await;
    assert_stays_online(&alice, &bob.endpoint_id(), Duration::from_secs(3)).await;
    assert_stays_online(&bob, &alice.endpoint_id(), Duration::from_secs(3)).await;
}

#[tokio::test]
async fn declining_a_nearby_invite_leaves_the_sender_unpaired() {
    let alice = common::spawn_node("alice").await;
    let bob = common::spawn_node("bob").await;
    bob.set_discoverability(Discoverability::Everyone).await;

    alice
        .inject_nearby_device_for_tests(&bob.endpoint_id())
        .await;

    let delivered = alice
        .invite_nearby_device(&bob.endpoint_id(), "test-blob-ticket", 1, 4)
        .await
        .expect("invite should be delivered");
    assert!(delivered);

    bob.decline_nearby_invite(&alice.endpoint_id(), false)
        .await
        .expect("decline should succeed");

    assert!(
        bob.list_paired().unwrap().is_empty(),
        "declining must not pair"
    );

    // Sender-side observation of a decline, same event as an accept — see
    // the acceptance test above for why this is polled rather than asserted
    // immediately.
    common::wait_until(
        "alice to observe bob's decline",
        Duration::from_secs(15),
        || alice.events.has_event("paired-invite-response"),
    )
    .await;
    let responses = alice.events.events_with_name("paired-invite-response");
    assert_eq!(responses.len(), 1);
    let payload: serde_json::Value =
        serde_json::from_str(responses[0].payload.as_deref().unwrap()).unwrap();
    assert_eq!(payload["endpoint_id"], bob.endpoint_id());
    assert_eq!(payload["response"], "declined");

    // A decline must stay toast-only on the sender's side too — mutual
    // pairing only commits on an accept.
    assert!(
        alice.list_paired().unwrap().is_empty(),
        "declining must not pair the sender either"
    );
}

#[tokio::test]
async fn a_promoted_device_leaves_the_nearby_list() {
    let alice = common::spawn_node("alice").await;
    let bob = common::spawn_node("bob").await;
    bob.set_discoverability(Discoverability::Everyone).await;

    alice
        .inject_nearby_device_for_tests(&bob.endpoint_id())
        .await;

    alice
        .invite_nearby_device(&bob.endpoint_id(), "test-blob-ticket", 1, 1)
        .await
        .unwrap();
    bob.accept_nearby_invite(&alice.endpoint_id())
        .await
        .unwrap();

    assert!(
        !bob.list_nearby()
            .await
            .iter()
            .any(|d| d.endpoint_id == alice.endpoint_id()),
        "a paired device must not also appear under Nearby"
    );
}

/// Regression coverage for the fix where `accept_nearby_invite` could return
/// `Err` after already having committed the pairing: the accept notification
/// back to the (now possibly gone) sender is best-effort, not a condition of
/// success, because the durable side effects (paired record, allowlist entry,
/// `device-paired` event) already happened before it's attempted.
#[tokio::test]
async fn accept_nearby_invite_succeeds_even_if_the_sender_is_unreachable() {
    let alice = common::spawn_node("alice").await;
    let bob = common::spawn_node("bob").await;
    bob.set_discoverability(Discoverability::Everyone).await;

    alice
        .inject_nearby_device_for_tests(&bob.endpoint_id())
        .await;

    alice
        .invite_nearby_device(&bob.endpoint_id(), "test-blob-ticket", 1, 5)
        .await
        .expect("invite should be delivered");

    // The sender vanishes before bob gets around to accepting.
    alice.shutdown().await.expect("alice shutdown");

    bob.accept_nearby_invite(&alice.endpoint_id())
        .await
        .expect("accept must succeed even though the sender can no longer be notified");

    let paired = bob.list_paired().unwrap();
    assert_eq!(paired.len(), 1, "the pairing must still be committed");
    assert_eq!(paired[0].endpoint_id, alice.endpoint_id());
}

/// Defence-in-depth coverage: an unpaired peer can now send `InviteResponse`
/// (policy change so a nearby sender can learn of accept/decline), but the
/// receiving node must only act on one that matches a nearby invite it
/// actually sent — otherwise any unpaired stranger could spoof an acceptance
/// notification for an invite that was never sent.
#[tokio::test]
async fn unsolicited_invite_response_from_an_unpaired_peer_is_ignored() {
    let alice = common::spawn_node("alice").await;
    let bob = common::spawn_node("bob").await;
    // alice must accept bob's unpaired connection at the handshake gate to
    // reach the point where the message-level check under test applies.
    alice.set_discoverability(Discoverability::Everyone).await;

    // Bob never received an invite from alice — `decline_nearby_invite` is
    // just the public entry point that sends a raw `InviteResponse` without
    // requiring any prior relationship, used here to simulate a peer sending
    // one unprompted.
    bob.decline_nearby_invite(&alice.endpoint_id(), false)
        .await
        .expect("sending the message itself must still succeed");

    // Give any (incorrect) processing a moment to happen, then confirm it
    // didn't.
    tokio::time::sleep(Duration::from_secs(2)).await;
    assert!(
        !alice.events.has_event("paired-invite-response"),
        "alice never sent bob a nearby invite, so this response must be ignored"
    );
}

#[tokio::test]
async fn accepting_a_nearby_pair_request_promotes_both_sides() {
    let alice = common::spawn_node("alice").await;
    let bob = common::spawn_node("bob").await;
    bob.set_discoverability(Discoverability::Everyone).await;

    alice
        .inject_nearby_device_for_tests(&bob.endpoint_id())
        .await;

    let delivered = alice
        .request_nearby_pair(&bob.endpoint_id())
        .await
        .expect("pair request should be delivered");
    assert!(delivered, "pair request must report delivered");

    common::wait_until(
        "bob to observe alice's pair request",
        Duration::from_secs(15),
        || bob.events.has_event("nearby-pair-request-received"),
    )
    .await;
    let requests = bob.events.events_with_name("nearby-pair-request-received");
    assert_eq!(requests.len(), 1);
    let payload: serde_json::Value =
        serde_json::from_str(requests[0].payload.as_deref().unwrap()).unwrap();
    assert_eq!(payload["remote_endpoint_id"], alice.endpoint_id());
    assert_eq!(payload["sender_name"], "alice");

    bob.accept_nearby_invite(&alice.endpoint_id())
        .await
        .expect("accept should succeed");

    let paired = bob.list_paired().unwrap();
    assert_eq!(paired.len(), 1);
    assert_eq!(paired[0].endpoint_id, alice.endpoint_id());

    common::wait_until(
        "alice to observe bob's acceptance",
        Duration::from_secs(15),
        || alice.events.has_event("paired-invite-response"),
    )
    .await;

    common::wait_until(
        "alice to also record bob as paired",
        Duration::from_secs(15),
        || {
            alice
                .list_paired()
                .unwrap()
                .iter()
                .any(|d| d.endpoint_id == bob.endpoint_id())
        },
    )
    .await;
}
