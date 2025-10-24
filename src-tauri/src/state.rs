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
        let blobs_dir = self.send_result.blobs_data_dir.clone();
        tokio::spawn(async move {
            match tokio::fs::remove_dir_all(&blobs_dir).await {
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
    pub async fn stop(&mut self) -> Result<(), String> {
        use std::time::Duration;
        
        tracing::info!("🛑 Stopping share session for ticket: {}", &self.ticket[..50.min(self.ticket.len())]);
        
        // Drop temp_tag first to allow cleanup (same as CLI)
        drop(std::mem::replace(&mut self.send_result.temp_tag, unsafe { std::mem::zeroed() }));
        tracing::info!("✅ Dropped temp_tag");
        
        // Gracefully shutdown the router with timeout (same as CLI implementation)
        tracing::info!("🔄 Shutting down router...");
        let router = std::mem::replace(&mut self.send_result.router, unsafe { std::mem::zeroed() });
        match tokio::time::timeout(Duration::from_secs(2), router.shutdown()).await {
            Ok(Ok(())) => {
                tracing::info!("✅ Router shutdown completed successfully");
            }
            Ok(Err(e)) => {
                tracing::warn!("⚠️  Router shutdown returned error: {}", e);
            }
            Err(_) => {
                tracing::warn!("⚠️  Router shutdown timed out after 2 seconds");
            }
        }
        
        // Drop everything else that owns the store
        drop(std::mem::replace(&mut self.send_result._store, unsafe { std::mem::zeroed() }));
        tracing::info!("✅ Dropped store");
        
        // Progress handle will be dropped automatically via _progress_handle
        
        // Clean up the blobs directory (best effort, don't fail on cleanup error)
        let blobs_dir = self.send_result.blobs_data_dir.clone();
        match tokio::fs::remove_dir_all(&blobs_dir).await {
            Ok(_) => {
                tracing::info!("✅ Successfully cleaned up blobs directory: {}", blobs_dir.display());
            }
            Err(e) => {
                tracing::warn!("⚠️  Failed to clean up blobs directory {}: {}", blobs_dir.display(), e);
                // Don't return error - cleanup is best effort
            }
        }
        
        Ok(())
    }
}

/// Thread-safe wrapper for AppState
pub type AppStateMutex = Arc<Mutex<AppState>>;
