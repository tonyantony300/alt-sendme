use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;

// Import the EventEmitter trait - we'll define it here or import it
pub trait EventEmitter: Send + Sync {
    fn emit_event(&self, event_name: &str) -> Result<(), String>;
    fn emit_event_with_payload(&self, event_name: &str, payload: &str) -> Result<(), String>;
}

// Type alias for the app handle - we use Arc<dyn EventEmitter> to allow cloning and avoid direct tauri dependency in core
pub type AppHandle = Option<Arc<dyn EventEmitter>>;

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

    /// Skip cleanup on drop — used to hang on to a partial download so it can resume.
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
        // Deleting a big dir can be slow, so hand it to a blocking thread rather
        // than freezing the async runtime (or a lock we're holding). If there's
        // no runtime around, just delete it here.
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
    pub entry_type: String, // "file" or "directory"

    // CRITICAL: These fields must be kept alive for the duration of the share
    pub router: iroh::protocol::Router, // Keeps the server running and protocols active
    pub temp_tag: iroh_blobs::api::TempTag, // Prevents data from being garbage collected
    pub _progress_handle: n0_future::task::AbortOnDropHandle<anyhow::Result<()>>, // Keeps event channel open
    pub _store: iroh_blobs::store::fs::FsStore, // Keeps the blob storage alive
    pub blobs_data_dir: AutoCleanupDir,         // Drop last to cleanup after handles are released
}

#[derive(Debug)]
pub struct ReceiveResult {
    pub message: String,
    pub file_path: PathBuf,
}

#[derive(Debug, Default)]
pub struct SendOptions {
    pub relay_mode: RelayModeOption,
    pub ticket_type: AddrInfoOptions,
    pub magic_ipv4_addr: Option<std::net::SocketAddrV4>,
    pub magic_ipv6_addr: Option<std::net::SocketAddrV6>,
}

#[derive(Debug, Default)]
pub struct ReceiveOptions {
    pub output_dir: Option<PathBuf>,
    pub relay_mode: RelayModeOption,
    pub magic_ipv4_addr: Option<std::net::SocketAddrV4>,
    pub magic_ipv6_addr: Option<std::net::SocketAddrV6>,
}

#[derive(Clone, Debug)]
pub enum RelayModeOption {
    Disabled,
    Default,
    Custom {
        urls: Vec<iroh::RelayUrl>,
        auth_token: Option<String>,
    },
}

impl Default for RelayModeOption {
    fn default() -> Self {
        Self::Default
    }
}

impl From<RelayModeOption> for iroh::endpoint::RelayMode {
    fn from(value: RelayModeOption) -> Self {
        match value {
            RelayModeOption::Disabled => iroh::endpoint::RelayMode::Disabled,
            RelayModeOption::Default => iroh::endpoint::RelayMode::Default,
            RelayModeOption::Custom { urls, auth_token } => {
                let map = iroh::RelayMap::from_iter(urls);
                let map = match auth_token {
                    Some(token) if !token.is_empty() => map.with_auth_token(token),
                    _ => map,
                };
                iroh::endpoint::RelayMode::Custom(map)
            }
        }
    }
}

#[cfg(test)]
mod relay_mode_tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn custom_relay_mode_builds_relay_map() {
        let url = iroh::RelayUrl::from_str("https://relay.example.com").unwrap();
        let mode = RelayModeOption::Custom {
            urls: vec![url],
            auth_token: None,
        };
        let relay_mode: iroh::endpoint::RelayMode = mode.into();
        assert!(matches!(relay_mode, iroh::endpoint::RelayMode::Custom(_)));
    }

    #[test]
    fn custom_relay_mode_with_auth_token() {
        let url = iroh::RelayUrl::from_str("https://relay.example.com").unwrap();
        let mode = RelayModeOption::Custom {
            urls: vec![url],
            auth_token: Some("secret-token".to_string()),
        };
        let relay_mode: iroh::endpoint::RelayMode = mode.into();
        assert!(matches!(relay_mode, iroh::endpoint::RelayMode::Custom(_)));
    }
}

/// # Description
/// Represents metadata about a file being shared,
/// including file_name, size, optional thumbnail, and MIME type.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilePreviewItem {
    pub file_name: String,
    pub size: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub thumbnail: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub file_name: String,
    pub item_count: u32,
    pub size: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub thumbnail: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub mime_type: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub items: Option<Vec<FilePreviewItem>>,
}

#[derive(
    Copy,
    Clone,
    PartialEq,
    Eq,
    Default,
    Debug,
    derive_more::Display,
    derive_more::FromStr,
    serde::Serialize,
    serde::Deserialize,
)]
pub enum AddrInfoOptions {
    #[default]
    Id,
    RelayAndAddresses,
    Relay,
    Addresses,
}

pub fn apply_options(addr: &mut iroh::EndpointAddr, opts: AddrInfoOptions) {
    match opts {
        AddrInfoOptions::Id => {
            addr.addrs.clear();
        }
        AddrInfoOptions::RelayAndAddresses => {
            // nothing to do
        }
        AddrInfoOptions::Relay => {
            addr.addrs
                .retain(|transport_addr| matches!(transport_addr, TransportAddr::Relay(_)));
        }
        AddrInfoOptions::Addresses => {
            addr.addrs
                .retain(|transport_addr| matches!(transport_addr, TransportAddr::Ip(_)));
        }
    }
}

pub fn get_or_create_secret() -> anyhow::Result<iroh::SecretKey> {
    match std::env::var("IROH_SECRET") {
        Ok(secret) => iroh::SecretKey::from_str(&secret).context("invalid secret"),
        Err(_) => {
            let key = iroh::SecretKey::generate();
            Ok(key)
        }
    }
}

use anyhow::Context;
use iroh::TransportAddr;
use std::str::FromStr;
