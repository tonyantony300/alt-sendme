// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod state;

use commands::{start_sharing, stop_sharing, receive_file, get_sharing_status};
use state::AppState;
use std::sync::Arc;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .manage(Arc::new(tokio::sync::Mutex::new(AppState::default())))
        .invoke_handler(tauri::generate_handler![
            start_sharing,
            stop_sharing,
            receive_file,
            get_sharing_status,
        ])
        .setup(|_app| {
            // Cleanup happens automatically when AppState is dropped
            // No need for explicit cleanup here since we're not keeping
            // long-running tasks that need to be cancelled
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
