use tauri::{AppHandle, Manager};

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};

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

/// Only the Windows/Linux close handler consults this — macOS hides on close
/// unconditionally (platform convention), so on macOS it would be dead code.
#[cfg(not(target_os = "macos"))]
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
    /// Last known `(generation, online, total)`, so a label change can
    /// re-render without re-querying. The generation is stored alongside the
    /// counts, under the same lock, so a stale refresh can never overwrite a
    /// fresher one that already landed — see `refresh_presence`.
    pub counts: std::sync::Mutex<(u64, usize, usize)>,
    /// Source of monotonically increasing generation numbers handed out to
    /// each `refresh_presence` call, in the order it was *requested* rather
    /// than the order it *completes* (refreshes race on a blocking file
    /// read and can finish out of order).
    pub next_generation: AtomicU64,
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
    // macOS menu bar items must be NSImage templates: the system renders them
    // as a mask so they invert against light/dark menu bars and stay legible
    // under Reduce Transparency. Without this the full-colour app icon is
    // pasted into the menu bar as-is.
    //
    // TODO(design): the source asset is still `icons/128x128.png`, a colour
    // icon. Templating makes it behave correctly, but a purpose-drawn
    // monochrome (alpha-only) asset would look considerably better.
    #[cfg(target_os = "macos")]
    {
        builder = builder.icon_as_template(true);
    }
    let tray = builder.build(app)?;

    app.manage(TrayHandles {
        tray,
        status,
        open,
        quit,
        labels: std::sync::Mutex::new(labels),
        counts: std::sync::Mutex::new((0, 0, 0)),
        next_generation: AtomicU64::new(0),
    });
    TRAY_ACTIVE.store(true, Ordering::Relaxed);
    Ok(())
}

/// Re-render the status item and tooltip from the cached counts + labels.
fn render(handles: &TrayHandles) {
    let labels = handles.labels.lock().expect("tray labels lock").clone();
    let (_generation, online, total) = *handles.counts.lock().expect("tray counts lock");
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

/// Write `(generation, online, total)` into `current` unless a newer
/// generation already landed there. Returns whether the write happened.
///
/// Pure and free of any Tauri/async types so the ordering guarantee that
/// `refresh_presence` relies on — a stale, late-finishing refresh must never
/// clobber a fresher one — is unit-testable on its own.
fn apply_if_newer(
    current: &mut (u64, usize, usize),
    generation: u64,
    online: usize,
    total: usize,
) -> bool {
    if generation <= current.0 {
        return false;
    }
    *current = (generation, online, total);
    true
}

/// Recompute presence from the node and re-render. Cheap enough to call on
/// every presence event — `list_paired` is a store read, not a network call.
///
/// Each call spawns an independent task, and that task does a *blocking*
/// file read (`paired-devices.json`) off the async executor to get the
/// counts. Tasks can therefore finish in a different order than the events
/// that triggered them arrived in. A monotonic generation number is handed
/// out synchronously, in call order, before the task is spawned; the task
/// only writes `counts` if its generation is still the newest one seen,
/// checked and written atomically under the `counts` lock via
/// `apply_if_newer`. This guarantees the tray always ends up reflecting the
/// most recently *requested* refresh, regardless of completion order —
/// while a stale completion is dropped, the newest request is always the
/// one that (eventually) writes, so it is never the one left out.
pub fn refresh_presence(app: &AppHandle) {
    let app = app.clone();
    let Some(handles) = app.try_state::<TrayHandles>() else {
        return;
    };
    let generation = handles.next_generation.fetch_add(1, Ordering::Relaxed) + 1;
    drop(handles);

    tauri::async_runtime::spawn(async move {
        let node = {
            let state = app.state::<crate::state::AppStateMutex>();
            let guard = state.lock().await;
            guard.node.clone()
        };
        let Some(node) = node else {
            return;
        };
        let Ok((online, total)) = node.presence_summary() else {
            return;
        };
        let Some(handles) = app.try_state::<TrayHandles>() else {
            return;
        };
        let wrote = {
            let mut counts = handles.counts.lock().expect("tray counts lock");
            apply_if_newer(&mut counts, generation, online, total)
        };
        if wrote {
            render(&handles);
        }
    });
}

#[cfg(test)]
mod refresh_ordering_tests {
    use super::apply_if_newer;

    #[test]
    fn later_request_wins_even_when_it_finishes_first() {
        let mut counts = (0, 0, 0);
        // Generation 2 (the later request) finishes first...
        assert!(apply_if_newer(&mut counts, 2, 2, 3));
        assert_eq!(counts, (2, 2, 3));
        // ...generation 1 (the earlier request) finishes after, and must
        // not clobber the fresher value it lost the race to.
        assert!(!apply_if_newer(&mut counts, 1, 0, 1));
        assert_eq!(counts, (2, 2, 3));
    }

    #[test]
    fn stale_generation_is_dropped_not_applied() {
        let mut counts = (5, 1, 3);
        assert!(!apply_if_newer(&mut counts, 3, 9, 9));
        assert_eq!(counts, (5, 1, 3));
    }

    #[test]
    fn equal_generation_is_not_treated_as_newer() {
        let mut counts = (4, 1, 1);
        assert!(!apply_if_newer(&mut counts, 4, 9, 9));
        assert_eq!(counts, (4, 1, 1));
    }

    #[test]
    fn strictly_increasing_generations_each_apply() {
        let mut counts = (0, 0, 0);
        for gen in 1..=5u64 {
            assert!(apply_if_newer(&mut counts, gen, gen as usize, 5));
        }
        assert_eq!(counts, (5, 5, 5));
    }
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
