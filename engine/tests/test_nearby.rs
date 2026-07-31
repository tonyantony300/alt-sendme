//! Nearby / local-network discovery E2E.
//!
//! These bind real endpoints, so run with `--test-threads=1`.

mod common;

use engine::Discoverability;

#[tokio::test]
async fn unpaired_peer_can_probe_identity_when_discoverable_to_everyone() {
    let alice = common::spawn_node("alice").await;
    let bob = common::spawn_node("bob").await;
    bob.set_discoverability(Discoverability::Everyone);

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
    bob.set_discoverability(Discoverability::PairedOnly);

    assert!(
        alice.probe_identity(&bob.endpoint_id()).await.is_err(),
        "an unpaired peer must not learn our name under PairedOnly"
    );
}

#[tokio::test]
async fn unpaired_peer_is_refused_when_off() {
    let alice = common::spawn_node("alice").await;
    let bob = common::spawn_node("bob").await;
    bob.set_discoverability(Discoverability::Off);

    assert!(alice.probe_identity(&bob.endpoint_id()).await.is_err());
}

#[tokio::test]
async fn already_paired_peers_still_probe_under_paired_only() {
    let (alice, bob) = common::spawn_paired_nodes().await;
    bob.set_discoverability(Discoverability::PairedOnly);

    let identity = alice
        .probe_identity(&bob.endpoint_id())
        .await
        .expect("paired peers must still resolve under PairedOnly");
    assert_eq!(identity.display_name, "bob");
}
