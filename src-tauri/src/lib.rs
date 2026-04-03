// Library entry point for Tauri. Used by the binary (desktop) and by the native Android/iOS app (mobile).

mod commands;
mod features;
mod platform;
mod state;
#[cfg(desktop)]
mod tray;
mod version;

use commands::{
    check_launch_intent, check_path_type, fetch_ticket_metadata, get_file_size, get_sharing_status,
    get_transport_status, receive_file, start_sharing, stop_sharing, toggle_context_menu,
};
use features::deep_link::{
    first_non_flag_arg, handle_deep_links, handle_deep_links_handle, DeepLinkParser,
};
use state::AppState;
use std::fs;
use std::sync::Arc;
use tauri_plugin_deep_link::DeepLinkExt;
use tracing::debug;
pub use version::get_app_version;

use tauri::Emitter as _;
use tauri::Manager as _;

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

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());

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

            // Check for deep links in the second instance argument list
            let parser = DeepLinkParser::new();
            let mut deep_link_handled = false;
            for arg in &args {
                if arg.starts_with("sendme://") {
                    if let Ok(payload) = parser.parse(arg) {
                        tracing::debug!(
                            "Deep link intercepted by single-instance guard: {:?}",
                            payload
                        );
                        let _ = app.emit("deep-link", payload);
                        deep_link_handled = true;
                        break;
                    }
                }
            }

            // Only process launch intent if deep link was not handled
            if !deep_link_handled {
                let maybe_path = first_non_flag_arg(args.into_iter().skip(1));
                if let Some(path) = maybe_path {
                    let app_handle = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let state = app_handle.state::<state::AppStateMutex>();
                        state.lock().await.launch_intent = Some(path.clone());
                        let _ = app_handle.emit("launch-intent", path);
                    });
                }
            }
        }))
    };

    let builder = builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_native_utils::init())
        .plugin(tauri_plugin_deep_link::init())
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
            fetch_ticket_metadata,
            toggle_context_menu,
        ])
        .setup(|app| {
            setup_common(app);

            // Initialize deep link parser with global state
            let parser = std::sync::Arc::new(DeepLinkParser::new());

            // Handle cold start deep link
            if let Ok(Some(urls)) = app.deep_link().get_current() {
                debug!("App launched with deep link: {:?}", &urls);
                let urls: Vec<String> = urls.iter().map(|u| u.to_string()).collect();
                handle_deep_links(app, &parser, urls, true);
            }

            // Handle runtime deep link
            let parser_clone = parser.clone();
            let app_handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                let urls = event.urls();
                debug!("Deep link event received: {:?}", &urls);
                let urls: Vec<String> = urls.iter().map(|u| u.to_string()).collect();
                handle_deep_links_handle(&app_handle, &parser_clone, urls, false);
            });

            // Register deep link protocols at runtime (not supported on macOS)
            #[cfg(any(target_os = "windows", target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                // Try to register all configured schemes; ignore errors for development
                let _ = app.deep_link().register_all();
            }

            #[cfg(all(desktop, not(target_os = "macos")))]
            tray::setup_tray(&app.handle())?;
            Ok(())
        });

    #[cfg(desktop)]
    let builder = builder.on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
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
        .run(|_app, _event| {
            // RunEvent::Reopen only exists on macOS (dock icon re-click)
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = _event {
                tray::open_and_focus(_app);
            }
        });
}

fn app_state_initial() -> AppState {
    let launch_intent = first_non_flag_arg(std::env::args().skip(1));
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
}
