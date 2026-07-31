//! Nearby / local-network discovery E2E.
//!
//! These bind real endpoints, so run with `--test-threads=1`.

mod common;

use common::TestNode;
use engine::Discoverability;
use std::time::Duration;

const PRESENCE_DEADLINE: Duration = Duration::from_secs(60);

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
