#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod state;

use commands::{start_sharing, stop_sharing, receive_file, get_sharing_status, check_path_type, get_transport_status, get_file_size};
use state::AppState;
use std::sync::Arc;
use std::fs;

fn cleanup_orphaned_directories() {
    // tracing::info!("🧹 Checking for orphaned .sendme-send-* directories...");
    
    if let Ok(current_dir) = std::env::current_dir() {
        if let Ok(entries) = fs::read_dir(&current_dir) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    if name.starts_with(".sendme-send-") && entry.path().is_dir() {
                        // tracing::info!("🗑️  Found orphaned directory: {}", name);
                        match fs::remove_dir_all(&entry.path()) {
                            Ok(_) => {
                                // tracing::info!("✅ Successfully cleaned up orphaned directory: {}", name);
                            }
                            Err(e) => {
                                // tracing::warn!("⚠️  Failed to clean up orphaned directory {}: {}", name, e);
                            }
                        }
                    }
                }
            }
        }
    }
}

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"))
        )
        .with_target(true)
        .with_thread_ids(true)
        .with_line_number(true)
        .init();
    
    // tracing::info!("🚀 Starting Sendme Desktop application");
    
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
            cleanup_orphaned_directories();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
