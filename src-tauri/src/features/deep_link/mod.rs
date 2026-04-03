mod deep_link;
use crate::state;
use std::sync::Arc;
use tauri::Emitter;
use tauri::Manager as _;
use tracing::debug;

pub use deep_link::DeepLinkParser;

pub fn first_non_flag_arg(args: impl IntoIterator<Item = String>) -> Option<String> {
    args.into_iter()
        .find(|arg| !arg.starts_with('-') && !arg.starts_with("sendme://"))
}

/// Handle deep link URLs and emit events to frontend
pub fn handle_deep_links(
    app: &tauri::App,
    parser: &std::sync::Arc<deep_link::DeepLinkParser>,
    urls: Vec<String>,
    is_cold_start: bool,
) {
    for url in urls {
        // Check for duplicate processing
        if parser.is_duplicate(&url) {
            debug!("Skipping duplicate deep link: {}", &url);
            continue;
        }

        // Parse the deep link URL
        match parser.parse(&url) {
            Ok(payload) => {
                parser.mark_processed(url.clone());
                debug!("Deep link parsed successfully: {:?}", payload);

                // Emit event to all windows using Emitter trait
                let windows: Vec<_> = app.webview_windows().values().cloned().collect();
                for window in windows {
                    let _ = window.emit("deep-link", &payload);
                }

                // For cold start, also update state if it's a receive ticket
                if is_cold_start && payload.action == "receive" {
                    if let Some(ticket) = &payload.ticket {
                        if let Some(state) =
                            app.try_state::<Arc<tokio::sync::Mutex<state::AppState>>>()
                        {
                            state.blocking_lock().launch_intent = Some(ticket.clone());
                        }
                    }
                }
            }
            Err(e) => {
                tracing::warn!("Failed to parse deep link: {}", e);
                // Emit error event to frontend
                let error_payload = serde_json::json!({
                    "error": e,
                    "url": url
                });
                let windows: Vec<_> = app.webview_windows().values().cloned().collect();
                for window in windows {
                    let _ = window.emit("deep-link-error", &error_payload);
                }
            }
        }
    }
}

/// Handle deep link URLs using an app handle (for use in closures)
pub fn handle_deep_links_handle(
    app_handle: &tauri::AppHandle,
    parser: &std::sync::Arc<deep_link::DeepLinkParser>,
    urls: Vec<String>,
    is_cold_start: bool,
) {
    for url in urls {
        // Check for duplicate processing
        if parser.is_duplicate(&url) {
            debug!("Skipping duplicate deep link: {}", &url);
            continue;
        }

        // Parse the deep link URL
        match parser.parse(&url) {
            Ok(payload) => {
                parser.mark_processed(url.clone());
                debug!("Deep link parsed successfully: {:?}", payload);

                // Emit event to all windows using Emitter trait
                let windows: Vec<_> = app_handle.webview_windows().values().cloned().collect();
                for window in windows {
                    let _ = window.emit("deep-link", &payload);
                }

                // For cold start, also update state if it's a receive ticket
                if is_cold_start && payload.action == "receive" {
                    if let Some(ticket) = &payload.ticket {
                        if let Some(state) =
                            app_handle.try_state::<Arc<tokio::sync::Mutex<state::AppState>>>()
                        {
                            state.blocking_lock().launch_intent = Some(ticket.clone());
                        }
                    }
                }
            }
            Err(e) => {
                tracing::warn!("Failed to parse deep link: {}", e);
                // Emit error event to frontend
                let error_payload = serde_json::json!({
                    "error": e,
                    "url": url
                });
                let windows: Vec<_> = app_handle.webview_windows().values().cloned().collect();
                for window in windows {
                    let _ = window.emit("deep-link-error", &error_payload);
                }
            }
        }
    }
}
