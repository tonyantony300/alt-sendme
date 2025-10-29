// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod state;

use commands::{start_sharing, stop_sharing, receive_file, get_sharing_status, check_path_type, get_transport_status, get_file_size};
use state::AppState;
use std::sync::Arc;
use std::fs;
use tauri::Manager;

/// Clean up any orphaned .sendme-* directories from previous runs
/// Scans both current_dir and temp_dir to handle transition and legacy directories
fn cleanup_orphaned_directories() {
    tracing::info!("🧹 Checking for orphaned .sendme-* directories...");
    
    // Scan both current_dir (legacy/transition) and temp_dir (current location)
    let scan_dirs = vec![
        std::env::current_dir().ok(),
        Some(std::env::temp_dir()),
    ];
    
    for base_dir in scan_dirs.into_iter().flatten() {
        tracing::info!("🔍 Scanning directory: {}", base_dir.display());
        
        if let Ok(entries) = fs::read_dir(&base_dir) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    // Clean up both send and recv directories
                    if (name.starts_with(".sendme-send-") || name.starts_with(".sendme-recv-")) 
                        && entry.path().is_dir() {
                        tracing::info!("🗑️  Found orphaned directory: {}", entry.path().display());
                        match fs::remove_dir_all(&entry.path()) {
                            Ok(_) => {
                                tracing::info!("✅ Successfully cleaned up orphaned directory: {}", name);
                            }
                            Err(e) => {
                                tracing::warn!("⚠️  Failed to clean up orphaned directory {}: {}", name, e);
                            }
                        }
                    }
                }
            }
        }
    }
    
    tracing::info!("🧹 Orphan cleanup complete");
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
            // Clean up any orphaned .sendme-* directories from previous runs
            cleanup_orphaned_directories();
            
            // Enable file drop handling for drag and drop functionality on Windows and Linux
            // macOS works natively with dragDropEnabled config, but we add explicit handlers
            // for Windows and Linux to ensure consistent behavior across distributions
            #[cfg(any(target_os = "windows", target_os = "linux"))]
            {
                // Use a closure to set up file drop when window is ready
                let window_handle = _app.handle();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(100));
                    if let Some(window) = window_handle.get_webview_window("main") {
                        let window_clone = window.clone();
                        window.on_file_drop(move |_window, event, paths| {
                            match event {
                                tauri::window::FileDropEvent::Hover { .. } => {
                                    tracing::debug!("File drag hover over window");
                                    // Emit drag-hover event to frontend
                                    let _ = window_clone.emit("tauri://drag-hover", ());
                                }
                                tauri::window::FileDropEvent::Drop { position: _ } => {
                                    if let Some(dropped_paths) = paths {
                                        tracing::debug!("Files dropped: {:?}", dropped_paths);
                                        // Convert paths to string vec
                                        let path_strings: Vec<String> = dropped_paths
                                            .iter()
                                            .map(|p| p.to_string_lossy().to_string())
                                            .collect();
                                        // Emit drag-drop event with paths to frontend
                                        // Position is optional, so we use a default value
                                        let payload = serde_json::json!({
                                            "paths": path_strings,
                                            "position": {
                                                "x": 0.0,
                                                "y": 0.0
                                            }
                                        });
                                        let _ = window_clone.emit("tauri://drag-drop", payload);
                                    }
                                }
                                tauri::window::FileDropEvent::Cancelled => {
                                    tracing::debug!("File drag cancelled");
                                    // Emit drag-leave event to frontend
                                    let _ = window_clone.emit("tauri://drag-leave", ());
                                }
                            }
                        });
                    }
                });
            }
            
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
