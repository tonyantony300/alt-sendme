use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Application state for managing sharing sessions
#[derive(Default)]
pub struct AppState {
    pub current_share: Option<ShareHandle>,
}

/// Handle for an active sharing session
pub struct ShareHandle {
    pub ticket: String,
    pub path: PathBuf,
    // This will keep the router/endpoint alive
    // We'll store the actual handle when we implement the commands
    _phantom: std::marker::PhantomData<()>,
}

impl ShareHandle {
    pub fn new(ticket: String, path: PathBuf) -> Self {
        Self {
            ticket,
            path,
            _phantom: std::marker::PhantomData,
        }
    }
}

/// Thread-safe wrapper for AppState
pub type AppStateMutex = Arc<Mutex<AppState>>;
