// Library entry point for Tauri. Used by the binary (desktop) and by the native Android/iOS app (mobile).

mod commands;
mod features;
mod logging;
mod platform;
mod state;
#[cfg(desktop)]
mod tray;
mod version;

pub use version::get_app_version;

use commands::*;

use state::AppState;
use std::fs;
use std::sync::Arc;

use tauri::{Emitter as _, Manager as _, RunEvent};

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
    let builder = tauri::Builder::default().plugin(tauri_plugin_store::Builder::new().build());

    // Skip in-app updater under Flatpak (`flatpak update` handles it).
    #[cfg(desktop)]
    let builder = if std::env::var_os("FLATPAK_ID").is_none() {
        builder.plugin(tauri_plugin_updater::Builder::new().build())
    } else {
        builder
    };

    #[cfg(desktop)]
    let builder = if std::env::var("ALT_SENDME_ALLOW_MULTI_INSTANCE").unwrap_or_default() == "1" {
        builder
    } else {
        builder.plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
            let maybe_path = first_non_flag_arg(args.into_iter().skip(1));
            if let Some(path) = maybe_path {
                let app_handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    let state = app_handle.state::<state::AppStateMutex>();
                    state.lock().await.launch_intent = Some(path.clone());
                    let _ = app_handle.emit("launch-intent", path);
                });
            }
        }))
    };

    let builder = builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_native_utils::init())
        .manage(Arc::new(tokio::sync::Mutex::new(app_state_initial())))
        .invoke_handler(tauri::generate_handler![
            start_sharing,
            send_items,
            stop_sharing,
            receive_file,
            cancel_receive,
            get_sharing_status,
            check_path_type,
            get_paths_mime_types,
            get_transport_status,
            get_file_size,
            #[cfg(desktop)]
            focus_main_window,
            check_launch_intent,
            fetch_ticket_metadata,
            verify_relays,
            verify_discovery,
            get_relay_status,
            toggle_context_menu,
            is_windows_portable,
            get_debug_logging,
            set_debug_logging,
            export_debug_bundle,
            clear_debug_logs,
            #[cfg(any(desktop, target_os = "android"))]
            get_node_status,
            #[cfg(any(desktop, target_os = "android"))]
            reconfigure_node_relay,
            #[cfg(any(desktop, target_os = "android"))]
            get_device_info,
            #[cfg(any(desktop, target_os = "android"))]
            set_device_display_name,
            #[cfg(any(desktop, target_os = "android"))]
            get_pairing_ticket,
            #[cfg(any(desktop, target_os = "android"))]
            start_pairing_host,
            #[cfg(any(desktop, target_os = "android"))]
            stop_pairing_host,
            #[cfg(any(desktop, target_os = "android"))]
            join_pairing,
            #[cfg(any(desktop, target_os = "android"))]
            list_paired_devices,
            #[cfg(any(desktop, target_os = "android"))]
            forget_paired_device,
            #[cfg(any(desktop, target_os = "android"))]
            rename_paired_device,
            #[cfg(any(desktop, target_os = "android"))]
            invite_paired_device,
            #[cfg(any(desktop, target_os = "android"))]
            respond_paired_invite,
        ])
        .setup(|app| {
            init_logging(app.handle());
            setup_common(app);
            #[cfg(any(desktop, target_os = "android"))]
            {
                let handle = app.handle().clone();
                tauri::async_runtime::block_on(async move {
                    let state = handle.state::<state::AppStateMutex>();
                    let init_handle = handle.clone();
                    match init_node_service(init_handle).await {
                        Ok(()) => {
                            if let Err(error) = handle.emit("device-node-ready", ()) {
                                tracing::warn!(%error, "failed to emit device-node-ready");
                            }
                        }
                        Err(error) => {
                            tracing::error!(%error, "failed to initialize device node");
                            state.lock().await.node_init_error = Some(error.clone());
                            if let Err(emit_error) = handle.emit("device-node-failed", error) {
                                tracing::warn!(%emit_error, "failed to emit device-node-failed");
                            }
                        }
                    }
                });
            }
            #[cfg(all(desktop, not(target_os = "macos")))]
            if let Err(error) = tray::setup_tray(&app.handle()) {
                tracing::warn!(
                    error = %error,
                    "System tray unavailable; app will continue without tray icon"
                );
            }
            Ok(())
        });

    #[cfg(desktop)]
    let builder = builder.on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            #[cfg(not(target_os = "macos"))]
            if !tray::is_active() {
                return;
            }

            api.prevent_close();
            tracing::debug!("App closed to system tray");
            if let Err(e) = window.hide() {
                tracing::warn!(error = %e, "failed to hide window");
            }
        }
    });

    builder
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app, event| {
            if matches!(event, RunEvent::Exit) {
                #[cfg(any(desktop, target_os = "android"))]
                {
                    let state = app.state::<state::AppStateMutex>();
                    tauri::async_runtime::block_on(async move {
                        let mut guard = state.lock().await;
                        if let Some(node) = guard.node.take() {
                            if let Err(error) = node.shutdown().await {
                                tracing::warn!(%error, "node shutdown error");
                            }
                        }
                    });
                }
            }
            // RunEvent::Reopen only exists on macOS (dock icon re-click)
            #[cfg(target_os = "macos")]
            if let RunEvent::Reopen { .. } = event {
                tray::open_and_focus(app);
            }
        });
}

fn first_non_flag_arg(args: impl IntoIterator<Item = String>) -> Option<String> {
    args.into_iter().find(|arg| !arg.starts_with('-'))
}

fn app_state_initial() -> AppState {
    let launch_intent = first_non_flag_arg(std::env::args().skip(1));
    AppState {
        launch_intent,
        ..Default::default()
    }
}

/// Install the global tracing subscriber. Shared by the desktop binary and the mobile
/// entry point — before this moved here, Android had no subscriber at all and every
/// `tracing::` call there was a silent no-op.
///
/// Any failure degrades to stdout-only logging; it must never block startup.
fn init_logging(app: &tauri::AppHandle) {
    let config_dir = app.path().app_config_dir().ok();
    let log_dir = app.path().app_log_dir().ok();

    match (config_dir, log_dir) {
        (Some(config_dir), Some(log_dir)) => logging::init(&config_dir, &log_dir),
        _ => {
            // Must still install *something*, or the process ends up with no subscriber
            // and even stdout logging is lost.
            eprintln!("could not resolve app directories; debug logging unavailable");
            logging::init_stdout_only();
        }
    }

    tracing::info!(
        "Starting DashBeam application v{}",
        version::get_app_version()
    );
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
    if let Some(window) = app.handle().get_webview_window("main") {
        platform::windows::window::adjust_initial_window_size(&window);
    }
}
