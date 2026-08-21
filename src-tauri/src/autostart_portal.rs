//! Flatpak autostart via `org.freedesktop.portal.Background`.
//!
//! The portal grants background permission and registers the host autostart
//! entry, so no `--filesystem=xdg-config/autostart` hole is needed. A denial is
//! normal and comes back as `Ok(false)`; `Err` means the portal itself failed.
//!
//! Everything here must stay `async` — the consent dialog is open until the
//! user answers, and blocking the main thread stalls the GTK loop.
//!
//! Linux-only: `ashpd` is a `cfg(target_os = "linux")` dependency, so this
//! module and its call site are gated on the target as well as the feature.

use ashpd::desktop::background::Background;

const REASON: &str = "Stay online so your paired devices can reach you";

/// The command the host runs at login. The bare binary name from the Flatpak
/// manifest is correct — a `/app/bin` path wouldn't exist outside the sandbox.
fn command() -> Vec<String> {
    vec!["dashbeam".to_string(), "--hidden".to_string()]
}

/// Only called from an explicit user toggle. No read counterpart exists — the
/// portal's only query is another request, which pops a consent dialog.
pub async fn set(enabled: bool) -> Result<bool, String> {
    match request(enabled).await {
        Ok(granted) => Ok(granted),
        // `Error::Response` means the user denied or dismissed the dialog —
        // an answer, not a malfunction.
        Err(ashpd::Error::Response(_)) => Ok(false),
        Err(e) => Err(format!("Background portal request failed: {e}")),
    }
}

async fn request(auto_start: bool) -> Result<bool, ashpd::Error> {
    let response = Background::request()
        .reason(REASON)
        .auto_start(auto_start)
        .command(command())
        .send()
        .await?
        .response()?;
    Ok(response.auto_start())
}
