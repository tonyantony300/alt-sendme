//! The only place that knows how autostart is achieved on each platform.
//!
//! Non-Flatpak desktop uses `tauri-plugin-autostart` (LaunchAgent on macOS,
//! registry Run key on Windows, `~/.config/autostart` on Linux — with
//! AppImage paths handled by the plugin). Flatpak needs the XDG Background
//! portal instead; see `autostart_portal`.
//!
//! Every entry point reports the state the OS actually has, never the state
//! that was requested — the toggle must not claim success the OS refused.

use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt;

/// True when running inside a Flatpak sandbox.
pub fn is_flatpak() -> bool {
    std::env::var_os("FLATPAK_ID").is_some()
}

/// `Ok(None)` = the platform cannot be asked.
///
/// Under Flatpak the plugin's answer would be meaningless (it inspects a
/// sandboxed path the host never reads), and the Background portal has no
/// read-only query — issuing a request just to read would pop a consent
/// dialog every time the user opens Settings. Callers keep their cached
/// value when this returns `None`.
pub fn is_enabled(app: &AppHandle) -> Result<Option<bool>, String> {
    if is_flatpak() {
        return Ok(None);
    }
    app.autolaunch()
        .is_enabled()
        .map(Some)
        .map_err(|e| e.to_string())
}

/// Async because the Flatpak path waits on a portal consent dialog, which is
/// open for as long as the user takes to answer it. Awaiting keeps that wait
/// off the main thread; blocking on it would freeze the window instead.
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
            // The OS may already be in the requested state, in which case the
            // "failure" is a no-op. Windows is the case that matters:
            // `auto-launch`'s `disable()` calls `RegKey::delete_value`, which
            // errors when the value is absent — so turning autostart off after
            // the user removed the entry via Task Manager would report failure,
            // the UI would revert the switch to ON, and the toggle would lie
            // about an OS state that is genuinely OFF. (macOS and Linux guard
            // with `if file.exists()` and are already idempotent.)
            //
            // Only trust a re-query that actually matches the request; anything
            // else is a real failure and must surface.
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
