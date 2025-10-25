use std::path::PathBuf;
use std::sync::Arc;

pub trait EventEmitter: Send + Sync {
    fn emit_event(&self, event_name: &str) -> Result<(), String>;
    fn emit_event_with_payload(&self, event_name: &str, payload: &str) -> Result<(), String>;
}

pub type AppHandle = Option<Arc<dyn EventEmitter>>;

pub struct SendResult {
    pub ticket: String,
    pub hash: String,
    pub size: u64,
    pub entry_type: String, // "file" or "directory"
    
    pub router: iroh::protocol::Router,  // Keeps the server running and protocols active
    pub temp_tag: iroh_blobs::api::TempTag, // Prevents data from being garbage collected
    pub blobs_data_dir: PathBuf, // Path for cleanup when share stops
    pub _progress_handle: n0_future::task::AbortOnDropHandle<anyhow::Result<()>>, // Keeps event channel open
    pub _store: iroh_blobs::store::fs::FsStore, // Keeps the blob storage alive
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
    Custom(iroh::RelayUrl),
}

impl Default for RelayModeOption {
    fn default() -> Self {
        Self::Default
    }
}

impl From<RelayModeOption> for iroh::RelayMode {
    fn from(value: RelayModeOption) -> Self {
        match value {
            RelayModeOption::Disabled => iroh::RelayMode::Disabled,
            RelayModeOption::Default => iroh::RelayMode::Default,
            RelayModeOption::Custom(url) => iroh::RelayMode::Custom(url.into()),
        }
    }
}

#[derive(
    Copy,
    Clone,
    PartialEq,
    Eq,
    Default,
    Debug,
    derive_more::Display,
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

pub fn apply_options(addr: &mut iroh::NodeAddr, opts: AddrInfoOptions) {
    match opts {
        AddrInfoOptions::Id => {
            addr.direct_addresses.clear();
            addr.relay_url = None;
        }
        AddrInfoOptions::RelayAndAddresses => {
        }
        AddrInfoOptions::Relay => {
            addr.direct_addresses.clear();
        }
        AddrInfoOptions::Addresses => {
            addr.relay_url = None;
        }
    }
}

pub fn get_or_create_secret() -> anyhow::Result<iroh::SecretKey> {
    match std::env::var("IROH_SECRET") {
        Ok(secret) => iroh::SecretKey::from_str(&secret).context("invalid secret"),
        Err(_) => {
            let key = iroh::SecretKey::generate(&mut rand::rng());
            Ok(key)
        }
    }
}

use anyhow::Context;
use std::str::FromStr;
