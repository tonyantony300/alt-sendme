use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use sendme::SendResult;

/// Application state for managing sharing sessions
#[derive(Default)]
pub struct AppState {
    pub current_share: Option<ShareHandle>,
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
        tracing::info!("🛑 Stopping share session for ticket: {}", &self.ticket[..50.min(self.ticket.len())]);
        
        // Clean up the blobs directory
        let blobs_dir = self.send_result.blobs_data_dir.clone();
        match tokio::fs::remove_dir_all(&blobs_dir).await {
            Ok(_) => {
                tracing::info!("✅ Successfully cleaned up blobs directory: {}", blobs_dir.display());
            }
            Err(e) => {
                tracing::warn!("⚠️  Failed to clean up blobs directory {}: {}", blobs_dir.display(), e);
                return Err(format!("Failed to clean up blobs directory: {}", e));
            }
        }
        
        Ok(())
    }
}

/// Thread-safe wrapper for AppState
pub type AppStateMutex = Arc<Mutex<AppState>>;
