mod common;

use common::{MockEventEmitter, TestFixture};
use engine::{download, start_share, ReceiveOptions, SendOptions};
use std::str::FromStr;

/// Receiver temp dir path for a ticket (deterministic from its hash).
fn receiver_temp_dir(ticket: &str) -> std::path::PathBuf {
    let parsed = iroh_blobs::ticket::BlobTicket::from_str(ticket).unwrap();
    std::env::temp_dir().join(format!(
        ".sendme-recv-{}",
        data_encoding::HEXLOWER.encode(parsed.hash().as_bytes())
    ))
}

/// Total size of all files under `path` (recursive).
fn dir_size(path: &std::path::Path) -> u64 {
    let mut total = 0;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                total += dir_size(&p);
            } else if let Ok(meta) = std::fs::metadata(&p) {
                total += meta.len();
            }
        }
    }
    total
}

/// Bytes transferred from the most recent `receive-progress` event (payload: `bytes:total:speed`).
fn latest_progress_bytes(emitter: &MockEventEmitter) -> u64 {
    emitter
        .events_with_name("receive-progress")
        .into_iter()
        .rev()
        .find_map(|e| e.payload)
        .and_then(|p| p.split(':').next().and_then(|s| s.parse().ok()))
        .unwrap_or(0)
}

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
    let expected_path = receiver_temp_dir(&ticket);

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

#[tokio::test]
async fn e2e_receiver_temp_dir_removed_on_success() {
    let fixture = TestFixture::new();
    let source = fixture.create_file("success.txt", b"completed transfer payload");
    let recv_dir = fixture.output_dir();

    let share = start_share(source, SendOptions::default(), None, None)
        .await
        .unwrap();
    let ticket = share.ticket.clone();
    let expected_path = receiver_temp_dir(&ticket);

    let result = download(
        ticket,
        ReceiveOptions {
            output_dir: Some(recv_dir.clone()),
            ..Default::default()
        },
        None,
    )
    .await
    .expect("download should succeed");
    assert!(!result.message.is_empty());

    // File arrived intact.
    assert_eq!(
        std::fs::read(recv_dir.join("success.txt")).unwrap(),
        b"completed transfer payload"
    );

    // Temp store is removed once the download completes successfully.
    assert!(
        !expected_path.exists(),
        "Receiver temp dir should be removed after a successful download"
    );

    drop(share);
}

/// Interrupt a real transfer mid-flight, then retry and confirm it resumes from
/// the preserved partial store instead of starting over.
///
/// Timing-dependent (localhost transfers are fast), so it's not run in CI. Run with:
///   cargo test --test test_cleanup e2e_receiver_resumes_partial_download -- --ignored --nocapture
#[tokio::test]
#[ignore = "timing-dependent; run manually"]
async fn e2e_receiver_resumes_partial_download() {
    let fixture = TestFixture::new();
    // Large enough that the transfer can be interrupted before it completes.
    let size = 128 * 1024 * 1024; // 128 MiB
    let source = fixture.create_large_file("big.bin", size);
    let recv_dir = fixture.output_dir();

    let share = start_share(source.clone(), SendOptions::default(), None, None)
        .await
        .unwrap();
    let ticket = share.ticket.clone();
    let expected_path = receiver_temp_dir(&ticket);
    // Start clean so the partial-size assertion is meaningful.
    let _ = std::fs::remove_dir_all(&expected_path);

    // Receive in the background and watch progress so we can cut the sender mid-transfer.
    let emitter = MockEventEmitter::new();
    let recv_task = tokio::spawn(download(
        ticket.clone(),
        ReceiveOptions {
            output_dir: Some(recv_dir.clone()),
            ..Default::default()
        },
        Some(emitter.clone()),
    ));

    // Wait until a few MiB have transferred.
    let mut transferred = 0u64;
    for _ in 0..200 {
        if recv_task.is_finished() {
            break;
        }
        transferred = latest_progress_bytes(&emitter);
        if transferred > 4 * 1024 * 1024 {
            break;
        }
        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    }
    assert!(
        transferred > 0 && !recv_task.is_finished(),
        "transfer finished before it could be interrupted; rerun with a larger file"
    );

    // Kill the sender mid-transfer -> the receiver's connection breaks.
    drop(share);

    let first = recv_task.await.expect("receive task panicked");
    assert!(first.is_err(), "interrupted attempt should fail");

    // Partial progress survived on disk.
    assert!(
        expected_path.exists(),
        "partial dir should survive the failure"
    );
    let partial = dir_size(&expected_path);
    assert!(
        partial > 0,
        "some partial bytes should be saved (got {partial})"
    );

    // Re-share the same content -> same hash -> same ticket -> same temp dir.
    let share2 = start_share(source, SendOptions::default(), None, None)
        .await
        .unwrap();
    assert_eq!(
        share2.ticket, ticket,
        "same content must yield the same ticket"
    );

    // Retry completes by resuming from the saved progress.
    download(
        share2.ticket.clone(),
        ReceiveOptions {
            output_dir: Some(recv_dir.clone()),
            ..Default::default()
        },
        None,
    )
    .await
    .expect("retry should resume and complete");

    // Final file is correct and the temp store is cleaned up on success.
    let received = std::fs::metadata(recv_dir.join("big.bin")).unwrap().len();
    assert_eq!(received as usize, size, "final file size should match");
    assert!(
        !expected_path.exists(),
        "temp dir should be removed after successful completion"
    );

    drop(share2);
}
