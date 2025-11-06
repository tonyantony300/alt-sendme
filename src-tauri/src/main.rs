// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod state;
mod version;

use commands::{start_sharing, stop_sharing, receive_file, get_sharing_status, check_path_type, get_transport_status, get_file_size};
use state::AppState;
use std::sync::Arc;
use std::fs;

#[cfg(target_os = "linux")]
use tauri::Manager;

/// Clean up any orphaned .sendme-* directories from previous runs
/// Scans both current_dir and temp_dir to handle transition and legacy directories
fn cleanup_orphaned_directories() {
    // Scan both current_dir (legacy/transition) and temp_dir (current location)
    let scan_dirs = vec![
        std::env::current_dir().ok(),
        Some(std::env::temp_dir()),
    ];
    
    for base_dir in scan_dirs.into_iter().flatten() {
        if let Ok(entries) = fs::read_dir(&base_dir) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    // Clean up both send and recv directories
                    if (name.starts_with(".sendme-send-") || name.starts_with(".sendme-recv-")) 
                        && entry.path().is_dir() {
                        match fs::remove_dir_all(&entry.path()) {
                            Ok(_) => {}
                            Err(e) => {
                                tracing::warn!("Failed to clean up orphaned directory {}: {}", name, e);
                            }
                        }
                    }
                }
            }
        }
    }
}


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
    
    tracing::info!("Starting Sendme Desktop application v{}", version::VERSION);
    
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
            // Clean up any orphaned .sendme-* directories from previous runs
            cleanup_orphaned_directories();
            
            // File drop support is enabled via dragDropEnabled: true in tauri.conf.json
            // Tauri v2 automatically emits tauri://drag-drop, tauri://drag-hover, and
            // tauri://drag-leave events when files are dragged over the window
            // The frontend (useDragDrop.ts) listens for these events
            tracing::debug!("File drop support enabled via dragDropEnabled config");
            
            // Disable window decorations only on Linux
            #[cfg(target_os = "linux")]
            {
                if let Some(window) = _app.handle().get_webview_window("main") {
                    let _ = window.set_decorations(false);
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
