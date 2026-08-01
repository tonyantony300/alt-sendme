//! Flatpak autostart via `org.freedesktop.portal.Background`.
//!
//! The portal both grants background-running permission and registers an
//! autostart entry on the host, so no `--filesystem=xdg-config/autostart`
//! hole is needed. The request is user-consented and CAN be denied; every
//! function here returns what the portal actually granted. A denial is a
//! normal outcome and comes back as `Ok(false)` — `Err` is reserved for the
//! portal being unreachable or failing outright.
//!
//! Everything here is `async` and must stay that way. The consent dialog is
//! open until the user clicks it, so blocking on this future would park
//! whichever thread awaited it; parking the main thread stalls the GTK loop
//! and the window is reported as unresponsive.
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
pub async fn set(enabled: bool) -> Result<bool, String> {
    match request(enabled).await {
        Ok(granted) => Ok(granted),
        // `Error::Response` means the portal ran to completion and the user
        // did not grant it — denied, or dismissed the dialog. That is an
        // answer, not a malfunction, so report the state we ended up in.
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
