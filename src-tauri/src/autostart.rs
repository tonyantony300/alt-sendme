//! The only place that knows how autostart is achieved on each platform.
//!
//! Non-Flatpak desktop uses `tauri-plugin-autostart`; Flatpak needs the XDG
//! Background portal instead, see `autostart_portal`.
//!
//! Every entry point reports the state the OS actually has, never the one
//! requested — the toggle must not claim a success the OS refused.

use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt;

/// True when running inside a Flatpak sandbox.
pub fn is_flatpak() -> bool {
    std::env::var_os("FLATPAK_ID").is_some()
}

/// `Ok(None)` = the platform cannot be asked. Under Flatpak the plugin inspects
/// a sandboxed path the host never reads, and the portal has no read-only query
/// — asking would pop a consent dialog on every Settings visit.
pub fn is_enabled(app: &AppHandle) -> Result<Option<bool>, String> {
    if is_flatpak() {
        return Ok(None);
    }
    app.autolaunch()
        .is_enabled()
        .map(Some)
        .map_err(|e| e.to_string())
}

/// Async because the Flatpak path waits on a portal consent dialog; blocking on
/// it would freeze the window.
pub async fn set(app: &AppHandle, enabled: bool) -> Result<bool, String> {
    #[cfg(all(target_os = "linux", feature = "autostart-portal"))]
    if is_flatpak() {
        return crate::autostart_portal::set(enabled).await;
    }
    if is_flatpak() {
        return Err("Autostart is unavailable in this Flatpak build".to_string());
    }
    let manager = app.autolaunch();
    let result = if enabled {
        manager.enable()
    } else {
        manager.disable()
    };
    match result {
        Ok(()) => manager.is_enabled().map_err(|e| e.to_string()),
        Err(error) => {
            // The OS may already be in the requested state, making the
            // "failure" a no-op — on Windows `disable()` errors when the Run
            // value is already absent. Only trust a re-query that matches the
            // request; anything else is a real failure and must surface.
            match manager.is_enabled() {
                Ok(actual) if actual == enabled => {
                    tracing::debug!(
                        enabled,
                        %error,
                        "autostart change reported an error but the OS is already in the requested state"
                    );
                    Ok(actual)
                }
                _ => Err(error.to_string()),
            }
        }
    }
}
