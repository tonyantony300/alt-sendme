// imports for tray
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

// to show confirmation dialog box for quit event from tray
// use tauri_plugin_dialog::DialogExt;

/// Return true if window was shown (or attempted) successfully, false otherwise.
fn open_and_focus(app: &AppHandle) -> bool {
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

pub fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open", true, None::<&str>)?; // open button
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?; // quit button
    let menu = Menu::with_items(app, &[&open, &quit])?;

    let mut builder = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(false)
        .tooltip("AltSendMe")
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
                //     .message("Are you sure you want to quit AltSendMe?")
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
        .on_tray_icon_event(move |tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                ..
            } => {
                let app = tray.app_handle();
                let _ = open_and_focus(&app);
            }
            _ => {}
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }

    let tray = builder.build(app)?;

    app.manage(tray);
    Ok(())
}
