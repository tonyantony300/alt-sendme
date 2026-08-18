//! Android background presence: decides when the foreground service should run.
//!
//! Presence for paired peers rides the persistent control connections held by
//! `NodeService`, and Nearby visibility rides the mDNS publisher on the same
//! endpoint. Both are tokio tasks in the app process, so when Android caches a
//! backgrounded process they stall and peers see the device go offline. The
//! foreground service exists purely to keep that process scheduled.
//!
//! The decision lives here rather than at each call site so the two inputs —
//! paired-device count and discoverability — cannot drift apart. [`refresh`] is
//! idempotent, so callers only have to know that *something* changed.

use std::sync::Arc;

use engine::{should_run_background_presence, NodeService};
use tauri::AppHandle;
use tauri_plugin_native_utils::NativeUtilsExt;

use crate::state::AppStateMutex;

/// Starts or stops the presence service to match the current state.
///
/// Never fails the caller: losing background presence degrades the app to
/// today's behaviour, which is not worth failing pairing or discoverability
/// changes over. Mirrors how `node_init_error` keeps send/receive working when
/// the node itself cannot start.
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

    // `is_connectable`, not `len`: `list_paired` returns stored records, which
    // include peers that unpaired remotely. Those keep no presence loop, so
    // counting them would pin the notification up forever with nothing to
    // maintain. `is_connectable` is the same predicate the presence loops
    // themselves use, so the service's lifetime tracks the work exactly.
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
