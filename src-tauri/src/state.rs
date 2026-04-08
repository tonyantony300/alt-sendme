use sendme::SendResult;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Application state for managing sharing sessions
#[derive(Default)]
pub struct AppState {
    pub current_share: Option<ShareHandle>,
    pub is_share_starting: bool, // True while start_sharing is preparing metadata/session
    pub is_transporting: bool,   // True when actual data transfer is happening
}

/// Handle for an active sharing session
/// CRITICAL: This struct holds the router and temp_tag which keeps the server alive
pub struct ShareHandle {
    pub ticket: String,
    pub _path: PathBuf,          // Keep path for potential future use
    pub send_result: SendResult, // This keeps router and temp_tag alive!
}

impl Drop for ShareHandle {
    fn drop(&mut self) {
        // Clean up the temporary blobs directory when share is stopped
        // Use blocking cleanup since Drop is synchronous
        // Spawn a thread to avoid blocking the async runtime
        let blobs_dir = self.send_result.blobs_data_dir.clone();
        std::thread::spawn(move || {
            // Use blocking std::fs instead of tokio::fs for cleanup in Drop
            match std::fs::remove_dir_all(&blobs_dir) {
                Ok(_) => {}
                Err(e) => {
                    tracing::warn!(
                        "Failed to clean up blobs directory {}: {}",
                        blobs_dir.display(),
                        e
                    );
                }
            }
        });
    }
}

impl ShareHandle {
    pub fn new(ticket: String, path: PathBuf, send_result: SendResult) -> Self {
        Self {
            ticket,
            _path: path,
            send_result,
        }
    }

    /// Explicitly stop the sharing session and clean up resources
    /// The actual cleanup will happen in Drop when the struct is destroyed
    pub async fn stop(&mut self) -> Result<(), String> {
        use std::time::Duration;

        // Gracefully shutdown the router with timeout (same as CLI implementation)
        match tokio::time::timeout(Duration::from_secs(2), self.send_result.router.shutdown()).await
        {
            Ok(Ok(())) => {}
            Ok(Err(e)) => {
                tracing::warn!("Router shutdown error: {}", e);
            }
            Err(_) => {
                tracing::warn!("Router shutdown timeout after 2 seconds");
            }
        }

        // temp_tag, _store, and _progress_handle will be dropped automatically when the method ends
        // Cleanup of blobs directory will happen in Drop trait

        Ok(())
    }
}

/// Thread-safe wrapper for AppState
pub type AppStateMutex = Arc<Mutex<AppState>>;

/// Dedicated launch-intent state, independent from AppState async mutex contention.
pub type LaunchIntentState = Arc<std::sync::Mutex<Option<String>>>;

/// Pending deep-link state used to recover cold-start deep links after the frontend is ready.
/// Kept separate from launch intents so deep links are not mistaken for send-file paths
pub type PendingDeepLinkState = Arc<std::sync::Mutex<Option<PendingDeepLink>>>;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PendingDeepLink {
    pub action: String,
    pub ticket: Option<String>,
}

pub fn set_launch_intent(state: &LaunchIntentState, value: String) {
    match state.lock() {
        Ok(mut guard) => {
            *guard = Some(value);
        }
        Err(poisoned) => {
            let mut guard = poisoned.into_inner();
            *guard = Some(value);
        }
    }
}

pub fn take_launch_intent(state: &LaunchIntentState) -> Option<String> {
    match state.lock() {
        Ok(mut guard) => guard.take(),
        Err(poisoned) => {
            let mut guard = poisoned.into_inner();
            guard.take()
        }
    }
}

pub fn set_pending_deep_link(state: &PendingDeepLinkState, value: PendingDeepLink) {
    match state.lock() {
        Ok(mut guard) => {
            *guard = Some(value);
        }
        Err(poisoned) => {
            let mut guard = poisoned.into_inner();
            *guard = Some(value);
        }
    }
}

/// Take the pending deep link from state.
///
/// Recovers the pending deep link when cold-starting from a deep link
pub fn take_pending_deep_link(state: &PendingDeepLinkState) -> Option<PendingDeepLink> {
    match state.lock() {
        Ok(mut guard) => guard.take(),
        Err(poisoned) => {
            let mut guard = poisoned.into_inner();
            guard.take()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{
        set_launch_intent, set_pending_deep_link, take_launch_intent, take_pending_deep_link,
        AppState, LaunchIntentState, PendingDeepLink, PendingDeepLinkState,
    };
    use std::sync::Arc;

    #[tokio::test(flavor = "current_thread")]
    async fn launch_intent_is_available_under_app_state_contention() {
        let app_state = Arc::new(tokio::sync::Mutex::new(AppState::default()));
        let launch_intent: LaunchIntentState = Arc::new(std::sync::Mutex::new(None));

        let _guard = app_state.lock().await;

        set_launch_intent(&launch_intent, "ticket-under-lock".to_string());
        assert_eq!(
            take_launch_intent(&launch_intent),
            Some("ticket-under-lock".to_string())
        );
    }

    #[tokio::test(flavor = "current_thread")]
    async fn pending_deep_link_is_available_under_app_state_contention() {
        let app_state = Arc::new(tokio::sync::Mutex::new(AppState::default()));
        let pending_deep_link: PendingDeepLinkState = Arc::new(std::sync::Mutex::new(None));

        let _guard = app_state.lock().await;

        set_pending_deep_link(
            &pending_deep_link,
            PendingDeepLink {
                action: "receive".to_string(),
                ticket: Some("ticket-under-lock".to_string()),
            },
        );
        assert_eq!(
            take_pending_deep_link(&pending_deep_link),
            Some(PendingDeepLink {
                action: "receive".to_string(),
                ticket: Some("ticket-under-lock".to_string()),
            })
        );
    }
}
