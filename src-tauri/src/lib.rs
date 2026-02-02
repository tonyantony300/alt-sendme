// Library entry point for Tauri. Used by the binary (desktop) and by the native Android/iOS app (mobile).

mod commands;
mod platform;
mod state;
#[cfg(not(target_os = "android"))]
mod tray;
mod version;

pub use version::get_app_version;

use commands::{
    check_launch_intent, check_path_type, get_file_size, get_sharing_status, get_transport_status,
    receive_file, start_sharing, stop_sharing,
};
use state::AppState;
use std::fs;
use std::sync::Arc;

use tauri::Manager;

/// Clean up any orphaned .sendme-* directories from previous runs
fn cleanup_orphaned_directories() {
    let scan_dirs = vec![std::env::current_dir().ok(), Some(std::env::temp_dir())];
    for base_dir in scan_dirs.into_iter().flatten() {
        if let Ok(entries) = fs::read_dir(&base_dir) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    if (name.starts_with(".sendme-send-") || name.starts_with(".sendme-recv-"))
                        && entry.path().is_dir()
                    {
                        if let Err(e) = fs::remove_dir_all(&entry.path()) {
                            tracing::warn!("Failed to clean up orphaned directory {}: {}", name, e);
                        }
                    }
                }
            }
        }
    }
}

/// Entry point for both desktop (from main.rs) and mobile (from native app via mobile_entry_point).
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(not(target_os = "android"))]
    run_desktop();
    #[cfg(target_os = "android")]
    run_android();
}

#[cfg(not(target_os = "android"))]
fn run_desktop() {
    tauri::Builder::default()
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
        .manage(Arc::new(tokio::sync::Mutex::new(app_state_initial())))
        .invoke_handler(tauri::generate_handler![
            start_sharing,
            stop_sharing,
            receive_file,
            get_sharing_status,
            check_path_type,
            get_transport_status,
            get_file_size,
            check_launch_intent,
        ])
        .setup(|app| {
            setup_common(app);
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

#[cfg(target_os = "android")]
fn run_android() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .manage(Arc::new(tokio::sync::Mutex::new(app_state_initial())))
        .invoke_handler(tauri::generate_handler![
            start_sharing,
            stop_sharing,
            receive_file,
            get_sharing_status,
            check_path_type,
            get_transport_status,
            get_file_size,
            check_launch_intent,
        ])
        .setup(|app| {
            setup_common(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn app_state_initial() -> AppState {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let launch_intent = if !args.is_empty() && !args[0].starts_with("-") {
        Some(args[0].clone())
    } else {
        None
    };
    AppState {
        launch_intent,
        ..Default::default()
    }
}

#[allow(unused_variables)]
fn setup_common(app: &tauri::App) {
    cleanup_orphaned_directories();
    tracing::debug!("File drop support enabled via dragDropEnabled config");

    #[cfg(target_os = "linux")]
    if let Some(window) = app.handle().get_webview_window("main") {
        let _ = window.set_decorations(false);
    }

    #[cfg(target_os = "windows")]
    std::thread::spawn(|| {
        if let Err(e) = crate::platform::windows::context_menu::register_context_menu() {
            tracing::warn!("Failed to auto-register context menu: {}", e);
        }
    });
}
