use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use sendme::SendResult;

/// Application state for managing sharing sessions
#[derive(Default)]
pub struct AppState {
    pub current_share: Option<ShareHandle>,
    pub is_transporting: bool, // True when actual data transfer is happening
}

/// Handle for an active sharing session
/// CRITICAL: This struct holds the router and temp_tag which keeps the server alive
pub struct ShareHandle {
    pub ticket: String,
    pub _path: PathBuf, // Keep path for potential future use
    pub send_result: SendResult, // This keeps router and temp_tag alive!
}

impl Drop for ShareHandle {
    fn drop(&mut self) {
        tracing::info!("🧹 Cleaning up share session for ticket: {}", &self.ticket[..50.min(self.ticket.len())]);
        
        // Clean up the temporary blobs directory when share is stopped
        // Use blocking cleanup since Drop is synchronous
        // Spawn a thread to avoid blocking the async runtime
        let blobs_dir = self.send_result.blobs_data_dir.clone();
        std::thread::spawn(move || {
            // Use blocking std::fs instead of tokio::fs for cleanup in Drop
            match std::fs::remove_dir_all(&blobs_dir) {
                Ok(_) => {
                    tracing::info!("✅ Successfully cleaned up blobs directory: {}", blobs_dir.display());
                }
                Err(e) => {
                    tracing::warn!("⚠️  Failed to clean up blobs directory {}: {}", blobs_dir.display(), e);
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
        
        tracing::info!("🛑 Stopping share session for ticket: {}", &self.ticket[..50.min(self.ticket.len())]);
        
        // Gracefully shutdown the router with timeout (same as CLI implementation)
        tracing::info!("🔄 Shutting down router...");
        match tokio::time::timeout(Duration::from_secs(2), self.send_result.router.shutdown()).await {
            Ok(Ok(())) => {
                tracing::info!("✅ Router shutdown completed successfully");
            }
            Ok(Err(e)) => {
                tracing::warn!("⚠️  Router shutdown error: {}", e);
            }
            Err(_) => {
                tracing::warn!("⚠️  Router shutdown timeout after 2 seconds");
            }
        }
        
        // temp_tag, _store, and _progress_handle will be dropped automatically when the method ends
        // Cleanup of blobs directory will happen in Drop trait
        tracing::info!("✅ All resources will be dropped when ShareHandle is destroyed");
        
        Ok(())
    }
}

/// Thread-safe wrapper for AppState
pub type AppStateMutex = Arc<Mutex<AppState>>;
