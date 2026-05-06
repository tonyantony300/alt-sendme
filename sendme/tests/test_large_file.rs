mod common;

use common::{MockEventEmitter, TestFixture};
use sendme::{download, start_share, ReceiveOptions, SendOptions};

#[tokio::test]
async fn e2e_large_file_integrity() {
    let fixture = TestFixture::new();
    // 10MB deterministic pattern
    let source = fixture.create_large_file("large.bin", 10_000_000);
    let recv_dir = fixture.output_dir();

    let share = start_share(source.clone(), SendOptions::default(), None, None)
        .await
        .expect("start_share should succeed");

    assert_eq!(share.size, 10_000_000);

    download(
        share.ticket.clone(),
        ReceiveOptions {
            output_dir: Some(recv_dir.clone()),
            ..Default::default()
        },
        None,
    )
    .await
    .expect("download should succeed");

    let original = std::fs::read(&source).unwrap();
    let received = std::fs::read(recv_dir.join("large.bin")).expect("received file should exist");

    assert_eq!(
        received.len(),
        original.len(),
        "file size should match (10MB)"
    );
    assert_eq!(
        received, original,
        "10MB file should be identical after P2P transfer"
    );

    drop(share);
}

#[tokio::test]
async fn e2e_progress_events_emitted() {
    let fixture = TestFixture::new();
    // 5MB to ensure progress events fire (they trigger every 1MB)
    let source = fixture.create_large_file("progress.bin", 5_000_000);
    let recv_dir = fixture.output_dir();

    let receiver_emitter = MockEventEmitter::new();

    let share = start_share(source, SendOptions::default(), None, None)
        .await
        .expect("start_share should succeed");

    download(
        share.ticket.clone(),
        ReceiveOptions {
            output_dir: Some(recv_dir.clone()),
            ..Default::default()
        },
        Some(receiver_emitter.clone()),
    )
    .await
    .expect("download should succeed");

    // Progress events should have been emitted for a 5MB file
    let progress_events = receiver_emitter.events_with_name("receive-progress");
    assert!(
        !progress_events.is_empty(),
        "should have at least one progress event for a 5MB transfer"
    );

    // Verify progress payload format: "bytes_transferred:total_bytes:speed_int"
    for event in &progress_events {
        let payload = event.payload.as_ref().expect("progress event should have payload");
        let parts: Vec<&str> = payload.split(':').collect();
        assert_eq!(
            parts.len(),
            3,
            "progress payload should have 3 colon-separated parts, got: {}",
            payload
        );
    }

    // Verify completion event fired
    assert!(receiver_emitter.has_event("receive-completed"));

    drop(share);
}
