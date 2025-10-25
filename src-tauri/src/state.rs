use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use sendme::SendResult;

#[derive(Default)]
pub struct AppState {
    pub current_share: Option<ShareHandle>,
    pub is_transporting: bool, // True when actual data transfer is happening
}

pub struct ShareHandle {
    pub ticket: String,
    pub _path: PathBuf, // Keep path for potential future use
    pub send_result: SendResult, // This keeps router and temp_tag alive!
}

impl Drop for ShareHandle {
    fn drop(&mut self) {
        // tracing::info!("🧹 Dropping share session for ticket: {}", &self.ticket[..50.min(self.ticket.len())]);
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
    
    pub async fn stop(&mut self) -> Result<(), String> {
        use std::time::Duration;
        
        // tracing::info!("🛑 Stopping share session for ticket: {}", &self.ticket[..50.min(self.ticket.len())]);
        
        // tracing::info!("🔄 Shutting down router...");
        match tokio::time::timeout(Duration::from_secs(2), self.send_result.router.shutdown()).await {
            Ok(Ok(())) => {
                // tracing::info!("✅ Router shutdown completed successfully");
            }
            Ok(Err(e)) => {
                // tracing::warn!("⚠️  Router shutdown returned error: {}", e);
            }
            Err(_) => {
                // tracing::warn!("⚠️  Router shutdown timed out after 2 seconds");
            }
        }
        
        let blobs_dir = self.send_result.blobs_data_dir.clone();
        
        if blobs_dir.exists() {
            match tokio::fs::remove_dir_all(&blobs_dir).await {
                Ok(_) => {
                    // tracing::info!("✅ Successfully cleaned up blobs directory: {}", blobs_dir.display());
                }
                Err(e) => {
                    // tracing::warn!("⚠️  Failed to clean up blobs directory {}: {}", blobs_dir.display(), e);
                }
            }
        } else {
            // tracing::debug!("📁 Blobs directory already cleaned up: {}", blobs_dir.display());
        }
        
        // tracing::info!("✅ All resources will be dropped when method ends");
        
        Ok(())
    }
}

pub type AppStateMutex = Arc<Mutex<AppState>>;
