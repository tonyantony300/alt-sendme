// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod state;

use commands::{start_sharing, stop_sharing, receive_file, get_sharing_status, check_path_type, get_transport_status, get_file_size};
use state::AppState;
use std::sync::Arc;

fn main() {
    // Initialize tracing for better debugging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"))
        )
        .with_target(true)
        .with_thread_ids(true)
        .with_line_number(true)
        .init();
    
    tracing::info!("🚀 Starting Sendme Desktop application");
    
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
            check_path_type,
            get_transport_status,
            get_file_size,
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
