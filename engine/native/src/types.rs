use std::path::PathBuf;
use iroh_blobs::api::TempTag;
use n0_future::task::AbortOnDropHandle;

#[derive(Debug)]
pub struct AutoCleanupDir {
    path: PathBuf,
    armed: bool,
}

impl AutoCleanupDir {
    pub fn new(path: PathBuf) -> Self {
        Self { path, armed: true }
    }

    pub fn path(&self) -> &std::path::Path {
        &self.path
    }

    pub fn disarm(&mut self) {
        self.armed = false;
    }
}

impl Drop for AutoCleanupDir {
    fn drop(&mut self) {
        if !self.armed {
            return;
        }
        let path = std::mem::take(&mut self.path);
        let remove = move || {
            if let Err(e) = std::fs::remove_dir_all(&path) {
                tracing::warn!("Failed to cleanup directory {:?}: {}", path, e);
            }
        };
        match tokio::runtime::Handle::try_current() {
            Ok(handle) => {
                handle.spawn_blocking(remove);
            }
            Err(_) => remove(),
        }
    }
}

pub struct SendResult {
    pub ticket: String,
    pub hash: String,
    pub size: u64,
    pub entry_type: String,
    pub router: iroh::protocol::Router,
    pub temp_tag: TempTag,
    pub _progress_handle: AbortOnDropHandle<anyhow::Result<()>>,
    pub _store: iroh_blobs::store::fs::FsStore,
    pub blobs_data_dir: AutoCleanupDir,
    pub completed_peers: std::sync::Arc<std::sync::atomic::AtomicUsize>,
}

impl SendResult {
    /// Peers that pulled the entire payload during this share session.
    pub fn completed_peers(&self) -> usize {
        self.completed_peers
            .load(std::sync::atomic::Ordering::SeqCst)
    }
}

#[derive(Debug)]
pub struct ReceiveResult {
    pub message: String,
    pub file_path: PathBuf,
}
