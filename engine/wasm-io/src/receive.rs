use protocol::{
    download_to_store, get_or_create_secret, uses_custom_infra, with_system_ca_if_custom,
    AppHandle, ReceiveOptions,
};
use iroh::endpoint::presets;
use iroh::Endpoint;
use iroh_blobs::ticket::BlobTicket;
use std::str::FromStr;

use crate::export::export_collection_bytes;
use crate::storage::create_recv_mem_store;
use crate::types::WasmReceiveResult;

pub async fn download_files(
    ticket_str: String,
    options: ReceiveOptions,
    app_handle: AppHandle,
) -> anyhow::Result<WasmReceiveResult> {
    let ticket = BlobTicket::from_str(&ticket_str)?;
    let addr = ticket.addr().clone();
    let secret_key = get_or_create_secret()?;

    let custom_infra = uses_custom_infra(&options.discovery_mode, &options.relay_mode);
    let builder = with_system_ca_if_custom(
        Endpoint::builder(presets::Minimal)
            .alpns(vec![])
            .secret_key(secret_key)
            .relay_mode(options.relay_mode.clone().into()),
        custom_infra,
    );

    anyhow::ensure!(
        ticket.addr().relay_urls().count() > 0,
        "browser receive requires relay addresses in the ticket"
    );

    let endpoint = builder.bind().await?;
    let store = create_recv_mem_store();

    let downloaded =
        download_to_store(ticket, addr, &endpoint, store.as_ref(), &app_handle).await?;

    let files = export_collection_bytes(store.as_ref(), downloaded.collection).await?;

    endpoint.close().await;

    Ok(WasmReceiveResult { files })
}

/// Deprecated alias kept for internal callers migrating to [`download_files`].
pub async fn download_bytes(
    ticket_str: String,
    options: ReceiveOptions,
    app_handle: AppHandle,
) -> anyhow::Result<WasmReceiveResult> {
    download_files(ticket_str, options, app_handle).await
}
