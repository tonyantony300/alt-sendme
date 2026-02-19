const COMMANDS: &[&str] = &["select_download_folder", "select_send_document"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}
