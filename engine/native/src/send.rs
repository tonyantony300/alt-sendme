use std::path::PathBuf;

use protocol::{
    run_share_session, AppHandle, DiscoveryModeOption, FileMetadata, SendOptions, METADATA_ALPN,
};
use iroh::endpoint::presets;
use iroh::{address_lookup::pkarr::PkarrPublisher, endpoint::RelayMode, Endpoint};
use iroh_blobs::{
    provider::events::{ConnectMode, EventMask, EventSender, RequestMode},
    BlobsProtocol,
};
use tokio::sync::mpsc;

use crate::import::canonicalize_input_paths;
use crate::storage;
use crate::types::{AutoCleanupDir, SendResult};

/// Deprecated: prefer [`start_share_items`].
pub async fn start_share(
    path: PathBuf,
    options: SendOptions,
    app_handle: AppHandle,
    metadata: Option<FileMetadata>,
) -> anyhow::Result<SendResult> {
    start_share_items(vec![path], options, &app_handle, metadata).await
}

/// Starts sharing the provided paths (files or directories).
pub async fn start_share_items(
    paths: Vec<PathBuf>,
    options: SendOptions,
    app_handle: &AppHandle,
    metadata: Option<FileMetadata>,
) -> anyhow::Result<SendResult> {
    use protocol::{get_or_create_secret, AddrInfoOptions};
    use anyhow::ensure;

    ensure!(!paths.is_empty(), "no paths provided for sharing");

    // Ephemeral endpoint: must not reuse the node's persistent identity while
    // the control endpoint is online, or the relay rejects duplicate endpoint ids.
    let secret_key = get_or_create_secret()?;
    let relay_mode: RelayMode = options.relay_mode.clone().into();
    let builder = match &options.discovery_mode {
        DiscoveryModeOption::Custom { .. } => Endpoint::builder(presets::Minimal),
        DiscoveryModeOption::Default => Endpoint::builder(presets::N0),
    };
    let mut builder = protocol::with_system_ca(builder)
    .alpns(vec![iroh_blobs::ALPN.to_vec(), METADATA_ALPN.to_vec()])
    .secret_key(secret_key)
    .relay_mode(relay_mode.clone());

    match &options.discovery_mode {
        // Self-hosted discovery: publish our home relay to the custom pkarr relay so
        // peers can resolve us by endpoint id without touching n0's servers.
        DiscoveryModeOption::Custom { pkarr_relay_url, .. } => {
            builder = builder.address_lookup(PkarrPublisher::builder(pkarr_relay_url.clone()));
        }
        DiscoveryModeOption::Default => {
            if options.ticket_type == AddrInfoOptions::Id {
                builder = builder.address_lookup(PkarrPublisher::n0_dns());
            }
        }
    }
    if let Some(addr) = options.magic_ipv4_addr {
        builder = builder.bind_addr(addr)?;
    }
    if let Some(addr) = options.magic_ipv6_addr {
        builder = builder.bind_addr(addr)?;
    }

    let blobs_data_dir = storage::new_send_blobs_dir();
    let canonical_paths = canonicalize_input_paths(paths)?;
    let blobs_data_dir2 = blobs_data_dir.clone();
    let (progress_tx, progress_rx) = mpsc::channel(64);
    let app_handle_clone = app_handle.clone();
    let is_collection = canonical_paths.len() > 1;
    let entry_type_for_progress = if is_collection {
        "collection".to_string()
    } else if canonical_paths[0].is_dir() {
        "directory".to_string()
    } else {
        "file".to_string()
    };
    let ticket_type = options.ticket_type;

    let setup = async move {
        let endpoint = builder.bind().await?;
        let store = storage::create_send_store(&blobs_data_dir2).await?;

        let blobs = BlobsProtocol::new(
            &store,
            Some(EventSender::new(
                progress_tx,
                EventMask {
                    connected: ConnectMode::Notify,
                    get: RequestMode::NotifyLog,
                    ..EventMask::DEFAULT
                },
            )),
        );

        let (temp_tag, size, _collection) =
            crate::import::import_paths(canonical_paths, blobs.store()).await?;

        run_share_session(
            endpoint,
            store,
            blobs,
            temp_tag,
            size,
            metadata,
            ticket_type,
            &app_handle_clone,
            entry_type_for_progress,
            relay_mode,
            Some(blobs_data_dir2),
            progress_rx,
        )
        .await
        .map(|outcome| SendResult {
            ticket: outcome.ticket,
            hash: outcome.hash,
            size: outcome.size,
            entry_type: outcome.entry_type,
            router: outcome.router.expect("ephemeral share router"),
            temp_tag: outcome.temp_tag,
            blobs_data_dir: AutoCleanupDir::new(outcome.cleanup_dir.expect("native cleanup dir")),
            _progress_handle: outcome.progress_handle,
            _store: outcome.store,
        })
    };

    Ok(setup.await?)
}
