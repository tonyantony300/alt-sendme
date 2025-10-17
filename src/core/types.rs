use std::path::PathBuf;

/// Result of a send operation
pub struct SendResult {
    pub ticket: String,
    pub hash: String,
    pub size: u64,
    pub entry_type: String, // "file" or "directory"
    
    // CRITICAL: These fields must be kept alive for the duration of the share
    pub router: iroh::protocol::Router,  // Keeps the server running and protocols active
    pub temp_tag: iroh_blobs::api::TempTag, // Prevents data from being garbage collected
    pub blobs_data_dir: PathBuf, // Path for cleanup when share stops
    pub _progress_handle: n0_future::task::AbortOnDropHandle<anyhow::Result<()>>, // Keeps event channel open
    pub _store: iroh_blobs::store::fs::FsStore, // Keeps the blob storage alive
}

/// Result of a receive operation
#[derive(Debug)]
pub struct ReceiveResult {
    pub message: String,
    pub file_path: PathBuf,
}

/// Options for send operation
#[derive(Debug, Default)]
pub struct SendOptions {
    pub relay_mode: RelayModeOption,
    pub ticket_type: AddrInfoOptions,
    pub magic_ipv4_addr: Option<std::net::SocketAddrV4>,
    pub magic_ipv6_addr: Option<std::net::SocketAddrV6>,
}

/// Options for receive operation
#[derive(Debug, Default)]
pub struct ReceiveOptions {
    pub output_dir: Option<PathBuf>,
    pub relay_mode: RelayModeOption,
    pub magic_ipv4_addr: Option<std::net::SocketAddrV4>,
    pub magic_ipv6_addr: Option<std::net::SocketAddrV6>,
}

/// Available command line options for configuring relays.
#[derive(Clone, Debug)]
pub enum RelayModeOption {
    /// Disables relays altogether.
    Disabled,
    /// Uses the default relay servers.
    Default,
    /// Uses a single, custom relay server by URL.
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

/// Options to configure what is included in a [`NodeAddr`]
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
    /// Only the Node ID is added.
    ///
    /// This usually means that iroh-dns discovery is used to find address information.
    #[default]
    Id,
    /// Includes the Node ID and both the relay URL, and the direct addresses.
    RelayAndAddresses,
    /// Includes the Node ID and the relay URL.
    Relay,
    /// Includes the Node ID and the direct addresses.
    Addresses,
}

pub fn apply_options(addr: &mut iroh::NodeAddr, opts: AddrInfoOptions) {
    match opts {
        AddrInfoOptions::Id => {
            addr.direct_addresses.clear();
            addr.relay_url = None;
        }
        AddrInfoOptions::RelayAndAddresses => {
            // nothing to do
        }
        AddrInfoOptions::Relay => {
            addr.direct_addresses.clear();
        }
        AddrInfoOptions::Addresses => {
            addr.relay_url = None;
        }
    }
}

/// Get the secret key or generate a new one.
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
