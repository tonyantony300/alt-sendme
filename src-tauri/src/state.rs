use engine::SendResult;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Application state for managing sharing sessions
#[derive(Default)]
pub struct AppState {
    pub current_share: Option<ShareHandle>,
    pub is_share_starting: bool, // True while start_sharing is preparing metadata/session
    pub is_transporting: bool,   // True when actual data transfer is happening
    pub launch_intent: Option<String>, // Path to file/folder passed via CLI (e.g. context menu)
}

/// Handle for an active sharing session
/// CRITICAL: This struct holds the router and temp_tag which keeps the server alive
pub struct ShareHandle {
    pub ticket: String,
    pub _path: PathBuf,          // Keep path for potential future use
    pub send_result: SendResult, // This keeps router and temp_tag alive!
}

impl ShareHandle {
    pub fn new(ticket: String, path: PathBuf, send_result: SendResult) -> Self {
        Self {
            ticket,
            _path: path,
            send_result,
        }
    }

    /// Stop the sharing session and free its resources.
    /// The blobs temp dir gets removed when SendResult drops (its AutoCleanupDir field).
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

        // Explicitly close the endpoint to avoid "Endpoint dropped without calling close" error
        // This ensures graceful cleanup of the iroh endpoint resources
        let endpoint = self.send_result.router.endpoint();
        endpoint.close().await;

        // temp_tag, _store, _progress_handle and the blobs dir all get cleaned
        // up once SendResult drops.

        Ok(())
    }
}

/// Thread-safe wrapper for AppState
pub type AppStateMutex = Arc<Mutex<AppState>>;
