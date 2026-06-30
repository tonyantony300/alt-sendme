mod common;

use common::TestFixture;
use engine::{download, start_share, ReceiveOptions, SendOptions};
use std::str::FromStr;

#[tokio::test]
async fn e2e_sender_temp_dir_cleanup() {
    let fixture = TestFixture::new();
    let source = fixture.create_file("dummy.txt", b"dummy content");

    let share = start_share(source, SendOptions::default(), None, None)
        .await
        .expect("start_share should succeed");

    // Capture the temp directory path created by start_share
    let temp_dir_path = share.blobs_data_dir.path().to_path_buf();

    // Verify it exists while share is active
    assert!(
        temp_dir_path.exists(),
        "Temp dir should exist while share is active"
    );

    // Drop the share to trigger AutoCleanupDir drop
    drop(share);

    // Verify it is immediately deleted
    assert!(
        !temp_dir_path.exists(),
        "Temp dir should be deleted immediately after SendResult is dropped"
    );
}

#[tokio::test]
async fn e2e_receiver_temp_dir_preserved_on_failure() {
    let fixture = TestFixture::new();
    let recv_dir = fixture.output_dir();

    // To test receiver cleanup, we need to know the path it attempts to use.
    // The receiver temp dir is named based on the ticket hash.
    // We can create a fake invalid ticket to trigger a failure.
    // But iroh's BlobTicket parsing will fail early if it's completely invalid.
    // Let's create a technically valid ticket but to a non-existent sender.
    // Or simpler, just check the global temp directory before and after.

    // Instead of doing global temp directory diffing which could be flaky,
    // let's pass a ticket that will timeout or fail during fetch_metadata.
    // Wait, download uses fetch_metadata? No, download connects.
    // Let's create a real ticket but drop the sender so connection fails.

    let source = fixture.create_file("fail.txt", b"will fail");
    let share = start_share(source, SendOptions::default(), None, None)
        .await
        .unwrap();
    let ticket = share.ticket.clone();

    // Calculate expected receiver temp dir path
    // Let's parse the ticket locally to get the hash
    let parsed_ticket = iroh_blobs::ticket::BlobTicket::from_str(&ticket).unwrap();
    let expected_dir_name = format!(
        ".sendme-recv-{}",
        data_encoding::HEXLOWER.encode(parsed_ticket.hash().as_bytes())
    );
    let expected_path = std::env::temp_dir().join(expected_dir_name);

    // Drop the sender immediately so the receiver cannot connect
    drop(share);

    let mut options = ReceiveOptions::default();
    options.output_dir = Some(recv_dir);

    // The download should fail because the sender is gone
    let result = download(ticket, options, None).await;
    assert!(
        result.is_err(),
        "Download should fail since sender was dropped"
    );

    // Preserved on failure so a retry can resume from saved progress.
    assert!(
        expected_path.exists(),
        "Receiver temp dir should be preserved on failure for resumability"
    );

    let _ = std::fs::remove_dir_all(&expected_path);
}
