// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod platform;
mod state;
mod tray;
mod version;

use commands::{
    check_launch_intent, check_path_type, get_file_size, get_sharing_status, get_transport_status,
    receive_file, start_sharing, stop_sharing,
};
use state::AppState;
use std::fs;
use std::sync::Arc;

use tauri::Manager;

/// Clean up any orphaned .sendme-* directories from previous runs
/// Scans both current_dir and temp_dir to handle transition and legacy directories
fn cleanup_orphaned_directories() {
    // Scan both current_dir (legacy/transition) and temp_dir (current location)
    let scan_dirs = vec![std::env::current_dir().ok(), Some(std::env::temp_dir())];

    for base_dir in scan_dirs.into_iter().flatten() {
        if let Ok(entries) = fs::read_dir(&base_dir) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    // Clean up both send and recv directories
                    if (name.starts_with(".sendme-send-") || name.starts_with(".sendme-recv-"))
                        && entry.path().is_dir()
                    {
                        match fs::remove_dir_all(&entry.path()) {
                            Ok(_) => {}
                            Err(e) => {
                                tracing::warn!(
                                    "Failed to clean up orphaned directory {}: {}",
                                    name,
                                    e
                                );
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
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .with_target(true)
        .with_thread_ids(true)
        .with_line_number(true)
        .init();

    // Only disable hardware acceleration if running specifically as an AppImage
    #[cfg(target_os = "linux")]
    if std::env::var("APPIMAGE").is_ok() {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        tracing::debug!("AppImage detected: Disabling DMABUF for stability.");
    }

    tracing::info!(
        "Starting AltSendme Desktop application v{}",
        version::get_app_version()
    );

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .manage(Arc::new(tokio::sync::Mutex::new({
            // Check for launch args (potential file path from context menu)
            let args: Vec<String> = std::env::args().skip(1).collect();
            let launch_intent = if !args.is_empty() {
                // If the first argument doesn't start with -, treat it as a path
                if !args[0].starts_with("-") {
                    Some(args[0].clone())
                } else {
                    None
                }
            } else {
                None
            };

            AppState {
                launch_intent,
                ..Default::default()
            }
        })))
        .invoke_handler(tauri::generate_handler![
            start_sharing,
            stop_sharing,
            receive_file,
            get_sharing_status,
            check_path_type,
            get_transport_status,
            get_file_size,
            check_launch_intent,
            // TODO: Unimplemented because settings route is WIP
            // register_context_menu,
            // unregister_context_menu,
        ])
        .setup(|app| {
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
                if let Some(window) = app.handle().get_webview_window("main") {
                    let _ = window.set_decorations(false);
                }
            }

            // Auto-register context menu on Windows
            #[cfg(target_os = "windows")]
            {
                // We do this in a separate thread/task to not block startup significantly, though reg operations are fast
                std::thread::spawn(|| {
                    if let Err(e) = crate::platform::windows::context_menu::register_context_menu()
                    {
                        tracing::warn!("Failed to auto-register context menu: {}", e);
                    }
                });
            }

            tray::setup_tray(&app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                tracing::debug!("App closed to system tray");
                if let Err(e) = window.hide() {
                    tracing::warn!(error = %e, "failed to hide window");
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
