use protocol::{
    get_or_create_secret, run_share_session, uses_custom_infra, with_system_ca_if_custom,
    AddrInfoOptions, AppHandle, FileMetadata, SendOptions, METADATA_ALPN,
};
use iroh::endpoint::RelayMode;
use iroh_blobs::{
    provider::events::{ConnectMode, EventMask, EventSender, RequestMode},
    BlobsProtocol,
};
use tokio::sync::mpsc;

use crate::import::{import_named_bytes_collection, import_single_file_bytes};
use crate::storage::create_send_mem_store;
use crate::types::WasmShareSession;

pub async fn start_share_bytes(
    file_name: String,
    bytes: Vec<u8>,
    options: SendOptions,
    app_handle: &AppHandle,
    metadata: Option<FileMetadata>,
) -> anyhow::Result<WasmShareSession> {
    let secret_key = get_or_create_secret()?;
    let relay_mode: RelayMode = options.relay_mode.clone().into();
    let ticket_type = AddrInfoOptions::Relay;

    let custom_infra = uses_custom_infra(&options.discovery_mode, &options.relay_mode);
    let builder = with_system_ca_if_custom(
        protocol::endpoint_builder(secret_key, &relay_mode, true)?
            .alpns(vec![iroh_blobs::ALPN.to_vec(), METADATA_ALPN.to_vec()]),
        custom_infra,
    );

    let (progress_tx, progress_rx) = mpsc::channel(64);
    let endpoint = builder.bind().await?;
    let store = create_send_mem_store();

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

    let (temp_tag, size) = import_single_file_bytes(file_name, bytes, blobs.store()).await?;

    let outcome = run_share_session(
        endpoint,
        store,
        blobs,
        temp_tag,
        size,
        metadata,
        ticket_type,
        app_handle,
        "file".to_string(),
        relay_mode,
        None,
        progress_rx,
    )
    .await?;

    Ok(WasmShareSession {
        ticket: outcome.ticket,
        hash: outcome.hash,
        size: outcome.size,
        router: outcome.router.expect("ephemeral share router"),
        temp_tag: outcome.temp_tag,
        store: outcome.store,
        _progress_handle: outcome.progress_handle,
    })
}

pub async fn start_share_items_bytes(
    items: Vec<(String, Vec<u8>)>,
    entry_type: String,
    options: SendOptions,
    app_handle: &AppHandle,
    metadata: Option<FileMetadata>,
) -> anyhow::Result<WasmShareSession> {
    let secret_key = get_or_create_secret()?;
    let relay_mode: RelayMode = options.relay_mode.clone().into();
    let ticket_type = AddrInfoOptions::Relay;

    let custom_infra = uses_custom_infra(&options.discovery_mode, &options.relay_mode);
    let builder = with_system_ca_if_custom(
        protocol::endpoint_builder(secret_key, &relay_mode, true)?
            .alpns(vec![iroh_blobs::ALPN.to_vec(), METADATA_ALPN.to_vec()]),
        custom_infra,
    );

    let (progress_tx, progress_rx) = mpsc::channel(64);
    let endpoint = builder.bind().await?;
    let store = create_send_mem_store();

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

    let (temp_tag, size) = import_named_bytes_collection(items, blobs.store()).await?;

    let outcome = run_share_session(
        endpoint,
        store,
        blobs,
        temp_tag,
        size,
        metadata,
        ticket_type,
        app_handle,
        entry_type,
        relay_mode,
        None,
        progress_rx,
    )
    .await?;

    Ok(WasmShareSession {
        ticket: outcome.ticket,
        hash: outcome.hash,
        size: outcome.size,
        router: outcome.router.expect("ephemeral share router"),
        temp_tag: outcome.temp_tag,
        store: outcome.store,
        _progress_handle: outcome.progress_handle,
    })
}
