const COMMANDS: &[&str] = &[
    "select_download_folder",
    "select_send_document",
    "select_send_folder",
    "consume_share_intent",
    "cancel_job",
    "export_to_tree",
    "open_download_folder",
    "export_to_media_store",
    "open_download_target",
    "get_window_insets",
    "start_presence_service",
    "stop_presence_service",
    "write_text_to_uri",
    "fetch_update_manifest",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}
