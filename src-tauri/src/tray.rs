use tauri::{AppHandle, Manager};

use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{
    menu::{Menu, MenuItem},
    path::BaseDirectory,
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
};

// to show confirmation dialog box for quit event from tray
// use tauri_plugin_dialog::DialogExt;

static TRAY_ACTIVE: AtomicBool = AtomicBool::new(false);

/// Mirrors the frontend's `minimizeToTray` setting. Lives here rather than in
/// `AppState` because the window-close handler is synchronous and cannot lock
/// the async `AppStateMutex`.
static BACKGROUND_ON_CLOSE: AtomicBool = AtomicBool::new(true);

pub fn is_active() -> bool {
    TRAY_ACTIVE.load(Ordering::Relaxed)
}

pub fn background_on_close() -> bool {
    BACKGROUND_ON_CLOSE.load(Ordering::Relaxed)
}

pub fn set_background_on_close(enabled: bool) {
    BACKGROUND_ON_CLOSE.store(enabled, Ordering::Relaxed);
}

/// Tray strings, pushed from the frontend so the menu follows the app
/// language. English defaults cover the window between process start and the
/// webview's first `set_tray_labels` call.
#[derive(Clone, serde::Deserialize)]
pub struct TrayLabels {
    pub open: String,
    pub quit: String,
    pub no_devices: String,
    /// Template with `{{online}}` and `{{total}}` placeholders.
    pub devices_online: String,
}

impl Default for TrayLabels {
    fn default() -> Self {
        Self {
            open: "Open".to_string(),
            quit: "Quit".to_string(),
            no_devices: "No paired devices".to_string(),
            devices_online: "{{online}} of {{total}} devices online".to_string(),
        }
    }
}

pub fn format_presence(labels: &TrayLabels, online: usize, total: usize) -> String {
    if total == 0 {
        return labels.no_devices.clone();
    }
    labels
        .devices_online
        .replace("{{online}}", &online.to_string())
        .replace("{{total}}", &total.to_string())
}

/// Return true if window was shown (or attempted) successfully, false otherwise.
pub fn open_and_focus(app: &AppHandle) -> bool {
    // try main window by label first
    if let Some(window) = app.get_webview_window("main") {
        if let Err(e) = window.show() {
            tracing::warn!("Failed to show window: {}", e);
            return false;
        }
        if let Err(e) = window.set_focus() {
            tracing::warn!("Failed to set focus on window: {}", e);
        }
        return true;
    }

    // fallback: use the first available webview window
    if let Some((_label, window)) = app.webview_windows().iter().next() {
        if let Err(e) = window.show() {
            tracing::warn!("Failed to show fallback window: {}", e);
            return false;
        }
        if let Err(e) = window.set_focus() {
            tracing::warn!("Failed to set focus on fallback window: {}", e);
        }
        return true;
    }

    tracing::error!("No window available to show");
    false
}

/// Everything needed to mutate the tray after it is built. Managed in Tauri
/// state because `setup_tray` returns before any presence event arrives.
pub struct TrayHandles {
    pub tray: tauri::tray::TrayIcon,
    pub status: MenuItem<tauri::Wry>,
    pub open: MenuItem<tauri::Wry>,
    pub quit: MenuItem<tauri::Wry>,
    pub labels: std::sync::Mutex<TrayLabels>,
    /// Last known counts, so a label change can re-render without re-querying.
    pub counts: std::sync::Mutex<(usize, usize)>,
}

pub fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let labels = TrayLabels::default();
    // Disabled: a status readout, not an action.
    let status = MenuItem::with_id(app, "status", &labels.no_devices, false, None::<&str>)?;
    let open = MenuItem::with_id(app, "open", &labels.open, true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", &labels.quit, true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&status, &open, &quit])?;

    let mut builder = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("DashBeam")
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "open" => {
                open_and_focus(app);
            }
            "quit" => {
                tracing::info!("Quit requested from tray");

                // If a confirmation dialog should be shown before quit:
                // ----------------------------------------------
                // let handle = app.clone();
                // handle
                //     .dialog()
                //     .message("Are you sure you want to quit DashBeam?")
                //     .title("Confirm exit")
                //     .buttons(tauri_plugin_dialog::MessageDialogButtons::OkCancel)
                //     .kind(tauri_plugin_dialog::MessageDialogKind::Warning)
                //     .show(move |proceed| {
                //         if proceed {
                //             handle.exit(0);
                //         }
                //     });
                // ----------------------------------------------

                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(move |tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                ..
            } = event
            {
                let app = tray.app_handle();
                let _ = open_and_focus(&app);
            }
        });

    let icon = match app
        .path()
        .resolve("icons/128x128.png", BaseDirectory::Resource)
        .ok()
        .and_then(|p| tauri::image::Image::from_path(&p).ok())
    {
        Some(img) => img,
        None => {
            tracing::warn!("Could not load 128x128 tray icon, falling back to default window icon");
            app.default_window_icon().cloned().ok_or_else(|| {
                tauri::Error::InvalidIcon(std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "tray icon not found",
                ))
            })?
        }
    };

    builder = builder.icon(icon);
    let tray = builder.build(app)?;

    app.manage(TrayHandles {
        tray,
        status,
        open,
        quit,
        labels: std::sync::Mutex::new(labels),
        counts: std::sync::Mutex::new((0, 0)),
    });
    TRAY_ACTIVE.store(true, Ordering::Relaxed);
    Ok(())
}

/// Re-render the status item and tooltip from the cached counts + labels.
fn render(handles: &TrayHandles) {
    let labels = handles.labels.lock().expect("tray labels lock").clone();
    let (online, total) = *handles.counts.lock().expect("tray counts lock");
    let status = format_presence(&labels, online, total);
    let _ = handles.status.set_text(&status);
    let _ = handles.open.set_text(&labels.open);
    let _ = handles.quit.set_text(&labels.quit);
    let _ = handles
        .tray
        .set_tooltip(Some(format!("DashBeam — {status}")));
}

/// Swap in translated strings; called by the frontend on mount and whenever
/// the app language changes.
pub fn apply_labels(app: &AppHandle, labels: TrayLabels) {
    let Some(handles) = app.try_state::<TrayHandles>() else {
        return;
    };
    *handles.labels.lock().expect("tray labels lock") = labels;
    render(&handles);
}

/// Recompute presence from the node and re-render. Cheap enough to call on
/// every presence event — `list_paired` is a store read, not a network call.
pub fn refresh_presence(app: &AppHandle) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let node = {
            let state = app.state::<crate::state::AppStateMutex>();
            let guard = state.lock().await;
            guard.node.clone()
        };
        let Some(node) = node else {
            return;
        };
        let Ok(counts) = node.presence_summary() else {
            return;
        };
        let Some(handles) = app.try_state::<TrayHandles>() else {
            return;
        };
        *handles.counts.lock().expect("tray counts lock") = counts;
        render(&handles);
    });
}

#[cfg(test)]
mod presence_label_tests {
    use super::{format_presence, TrayLabels};

    fn labels() -> TrayLabels {
        TrayLabels {
            open: "Open".to_string(),
            quit: "Quit".to_string(),
            no_devices: "No paired devices".to_string(),
            devices_online: "{{online}} of {{total}} devices online".to_string(),
        }
    }

    #[test]
    fn substitutes_both_counts() {
        assert_eq!(format_presence(&labels(), 2, 3), "2 of 3 devices online");
    }

    #[test]
    fn uses_the_empty_label_when_nothing_is_paired() {
        assert_eq!(format_presence(&labels(), 0, 0), "No paired devices");
    }

    #[test]
    fn leaves_unknown_placeholders_untouched() {
        let mut l = labels();
        l.devices_online = "{{online}}/{{total}} ({{bogus}})".to_string();
        assert_eq!(format_presence(&l, 1, 4), "1/4 ({{bogus}})");
    }
}
