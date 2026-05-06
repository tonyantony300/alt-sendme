mod common;

use common::TestFixture;
use sendme::{
    fetch_metadata, start_share, start_share_items, FileMetadata, ReceiveOptions, SendOptions,
};

#[tokio::test]
async fn e2e_metadata_preview() {
    let fixture = TestFixture::new();
    let source = fixture.create_file("preview_test.txt", b"preview content here");

    let metadata = FileMetadata {
        file_name: "preview_test.txt".into(),
        item_count: 1,
        size: 20,
        thumbnail: Some("data:image/png;base64,dGVzdA==".into()),
        mime_type: Some("text/plain".into()),
        items: None,
    };

    let share = start_share(source, SendOptions::default(), None, Some(metadata.clone()))
        .await
        .expect("start_share should succeed");

    let fetched = fetch_metadata(share.ticket.clone(), ReceiveOptions::default())
        .await
        .expect("fetch_metadata should succeed");

    assert_eq!(fetched.file_name, "preview_test.txt");
    assert_eq!(fetched.size, 20);
    assert_eq!(fetched.mime_type, Some("text/plain".into()));
    assert_eq!(
        fetched.thumbnail,
        Some("data:image/png;base64,dGVzdA==".into())
    );
    assert_eq!(fetched.item_count, 1);

    drop(share);
}

#[tokio::test]
async fn e2e_metadata_multi_item() {
    let fixture = TestFixture::new();
    let file_a = fixture.create_file("a.txt", b"aaa");
    let file_b = fixture.create_file("b.txt", b"bbb");

    let metadata = FileMetadata {
        file_name: "2 items".into(),
        item_count: 2,
        size: 6,
        thumbnail: None,
        mime_type: None,
        items: None,
    };

    let share = start_share_items(
        vec![file_a, file_b],
        SendOptions::default(),
        &None,
        Some(metadata),
    )
    .await
    .expect("start_share_items should succeed");

    let fetched = fetch_metadata(share.ticket.clone(), ReceiveOptions::default())
        .await
        .expect("fetch_metadata should succeed");

    assert_eq!(fetched.file_name, "2 items");
    assert_eq!(fetched.item_count, 2);
    assert_eq!(fetched.size, 6);

    drop(share);
}
