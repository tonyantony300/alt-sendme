mod deep_link;
use crate::state;
pub use deep_link::DeepLinkParser;
use tauri::Emitter;
use tauri::Manager as _;
use tracing::debug;

pub fn first_non_flag_arg(args: impl IntoIterator<Item = String>) -> Option<String> {
    args.into_iter()
        .find(|arg| !arg.starts_with('-') && !arg.contains("://"))
}

/// Handle deep link URLs and emit events to frontend
pub fn handle_deep_links(
    app: &tauri::App,
    parser: &std::sync::Arc<deep_link::DeepLinkParser>,
    urls: Vec<String>,
    is_cold_start: bool,
) {
    for url in urls {
        // Parse the deep link URL
        match parser.parse(&url) {
            Ok(payload) => {
                debug!("Deep link parsed successfully");

                // Emit event to all windows using Emitter trait
                let windows: Vec<_> = app.webview_windows().values().cloned().collect();
                for window in windows {
                    let _ = window.emit("deep-link", &payload);
                }

                // Persist cold-start deep links until the webview is ready to consume them
                if is_cold_start {
                    if let Some(state) = app.try_state::<state::PendingDeepLinkState>() {
                        state::set_pending_deep_link(
                            state.inner(),
                            state::PendingDeepLink {
                                action: payload.action.clone(),
                                ticket: payload.ticket.clone(),
                            },
                        );
                    }
                }
            }
            Err(e) => {
                tracing::warn!("Failed to parse deep link: {}", e);
                // Emit error event to frontend
                let error_payload = serde_json::json!({
                    "error": e,
                    "url": url.split('?').next().unwrap_or(&url)
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
        // Parse the deep link URL
        match parser.parse(&url) {
            Ok(payload) => {
                debug!("Deep link parsed successfully, actions={}", payload.action);

                // Emit event to all windows using Emitter trait
                let windows: Vec<_> = app_handle.webview_windows().values().cloned().collect();
                for window in windows {
                    let _ = window.emit("deep-link", &payload);
                }

                // Persist cold-start deep links until the webview is ready to consume them.
                if is_cold_start {
                    if let Some(state) = app_handle.try_state::<state::PendingDeepLinkState>() {
                        state::set_pending_deep_link(
                            state.inner(),
                            state::PendingDeepLink {
                                action: payload.action.clone(),
                                ticket: payload.ticket.clone(),
                            },
                        );
                    }
                }
            }
            Err(e) => {
                tracing::warn!("Failed to parse deep link: {}", e);
                // Emit error event to frontend
                let error_payload = serde_json::json!({
                    "error": e,
                    "url": url.split('?').next().unwrap_or(&url)
                });
                let windows: Vec<_> = app_handle.webview_windows().values().cloned().collect();
                for window in windows {
                    let _ = window.emit("deep-link-error", &error_payload);
                }
            }
        }
    }
}
