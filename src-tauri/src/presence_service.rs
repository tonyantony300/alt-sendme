//! Android background presence: decides when the foreground service should run.
//!
//! Presence and Nearby visibility ride tokio tasks in the app process, which
//! Android stalls once it caches a backgrounded app — the foreground service
//! exists to keep that process scheduled.
//!
//! The decision lives here so its two inputs (paired-device count and
//! discoverability) can't drift apart. [`refresh`] is idempotent.

use std::sync::Arc;

use engine::{should_run_background_presence, NodeService};
use tauri::AppHandle;
use tauri_plugin_native_utils::NativeUtilsExt;

use crate::state::AppStateMutex;

/// Starts or stops the presence service to match the current state. Never fails
/// the caller — losing background presence isn't worth failing a pairing or
/// discoverability change over.
pub async fn refresh(app: &AppHandle, state: &AppStateMutex) {
    let node = {
        let guard = state.lock().await;
        guard.node.clone()
    };

    apply(app, wanted(node).await).await;
}

/// Whether presence is worth keeping alive right now.
///
/// A node that failed to initialise has no connections and no publisher, so
/// there is nothing for the service to protect.
async fn wanted(node: Option<Arc<NodeService>>) -> bool {
    let Some(node) = node else {
        return false;
    };

    // `is_connectable`, not `len`: `list_paired` includes remotely-unpaired
    // peers, which keep no presence loop. Same predicate the loops use, so the
    // service's lifetime tracks the work exactly.
    let paired_count = node
        .list_paired()
        .map(|devices| {
            devices
                .iter()
                .filter(|device| device.pairing_status.is_connectable())
                .count()
        })
        .unwrap_or(0);
    should_run_background_presence(paired_count, node.discoverability().await)
}

async fn apply(app: &AppHandle, run: bool) {
    let result = if run {
        app.native_utils().start_presence_service()
    } else {
        app.native_utils().stop_presence_service()
    };

    if let Err(error) = result {
        tracing::warn!(
            target: "dashbeam::_events::presence::service_toggle_failed",
            run,
            %error,
        );
    }
}
