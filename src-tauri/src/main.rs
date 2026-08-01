// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Must be set before Tauri builds the webview, so it stays here rather than moving
    // into the shared setup hook.
    #[cfg(target_os = "linux")]
    if std::env::var("APPIMAGE").is_ok() {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    // Logging is initialised inside `run()`'s setup hook, where the log directory is
    // known. Doing it there rather than here is what gives Android a subscriber at all —
    // the mobile entry point never goes through this file.
    dashbeam_lib::run();
}
