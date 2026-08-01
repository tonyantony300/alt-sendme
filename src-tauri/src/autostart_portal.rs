//! Flatpak autostart via `org.freedesktop.portal.Background`.
//!
//! The portal both grants background-running permission and registers an
//! autostart entry on the host, so no `--filesystem=xdg-config/autostart`
//! hole is needed. The request is user-consented and CAN be denied; every
//! function here returns what the portal actually granted.
//!
//! Linux-only: `ashpd` is a `cfg(target_os = "linux")` dependency, so both
//! this module and its call site in `autostart` are gated on the target as
//! well as the `autostart-portal` feature.

use ashpd::desktop::background::Background;

const REASON: &str = "Stay online so your paired devices can reach you";

/// The command the host will run at login. Resolved inside the sandbox, so
/// the bare binary name from the Flatpak manifest's `command:` is correct —
/// the host-side `/app/bin` path would not exist outside the sandbox.
fn command() -> Vec<String> {
    vec!["dashbeam".to_string(), "--hidden".to_string()]
}

/// Only called from an explicit user toggle. There is no read counterpart:
/// the portal's only "query" is another request, which would pop a consent
/// dialog every time Settings opened.
pub fn set(enabled: bool) -> Result<bool, String> {
    request(enabled)
}

fn request(auto_start: bool) -> Result<bool, String> {
    tauri::async_runtime::block_on(async move {
        let response = Background::request()
            .reason(REASON)
            .auto_start(auto_start)
            .command(command())
            .send()
            .await
            .map_err(|e| format!("Background portal request failed: {e}"))?
            .response()
            .map_err(|e| format!("Background portal denied: {e}"))?;
        Ok(response.auto_start())
    })
}
