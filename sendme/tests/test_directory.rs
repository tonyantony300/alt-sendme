mod common;

use common::TestFixture;
use sendme::{download, start_share, ReceiveOptions, SendOptions};

#[tokio::test]
async fn e2e_directory_roundtrip() {
    let fixture = TestFixture::new();
    let source_dir = fixture.create_dir_with_files(
        "my_folder",
        &[
            ("root.txt", b"root file content"),
            ("sub/nested.txt", b"nested file content"),
        ],
    );
    let recv_dir = fixture.output_dir();

    let share = start_share(source_dir, SendOptions::default(), None, None)
        .await
        .expect("start_share should succeed");

    assert_eq!(share.entry_type, "directory");

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

    // Verify directory structure is preserved
    let root_content =
        std::fs::read(recv_dir.join("my_folder/root.txt")).expect("root.txt should exist");
    assert_eq!(root_content, b"root file content");

    let nested_content = std::fs::read(recv_dir.join("my_folder/sub/nested.txt"))
        .expect("sub/nested.txt should exist");
    assert_eq!(nested_content, b"nested file content");

    drop(share);
}

#[tokio::test]
async fn e2e_directory_with_deep_nesting() {
    let fixture = TestFixture::new();
    let source_dir = fixture.create_dir_with_files(
        "deep",
        &[
            ("a.txt", b"level 0"),
            ("l1/b.txt", b"level 1"),
            ("l1/l2/c.txt", b"level 2"),
            ("l1/l2/l3/d.txt", b"level 3"),
        ],
    );
    let recv_dir = fixture.output_dir();

    let share = start_share(source_dir, SendOptions::default(), None, None)
        .await
        .expect("start_share should succeed");

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

    assert_eq!(
        std::fs::read(recv_dir.join("deep/a.txt")).unwrap(),
        b"level 0"
    );
    assert_eq!(
        std::fs::read(recv_dir.join("deep/l1/b.txt")).unwrap(),
        b"level 1"
    );
    assert_eq!(
        std::fs::read(recv_dir.join("deep/l1/l2/c.txt")).unwrap(),
        b"level 2"
    );
    assert_eq!(
        std::fs::read(recv_dir.join("deep/l1/l2/l3/d.txt")).unwrap(),
        b"level 3"
    );

    drop(share);
}
