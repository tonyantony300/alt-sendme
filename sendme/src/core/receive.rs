use crate::core::send::METADATA_ALPN;
use crate::core::types::{
    get_or_create_secret, AppHandle, FileMetadata, ReceiveOptions, ReceiveResult,
};
use iroh::{discovery::dns::DnsDiscovery, Endpoint, TransportAddr};
use iroh_blobs::{
    api::{
        blobs::{ExportMode, ExportOptions, ExportProgressItem},
        remote::GetProgressItem,
        Store,
    },
    format::collection::Collection,
    get::{request::get_hash_seq_and_sizes, GetError, Stats},
    store::fs::FsStore,
    ticket::BlobTicket,
};
use n0_future::StreamExt;
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::time::Instant;
use tokio::{
    io::AsyncReadExt,
    select,
    time::{timeout, Duration},
};

// Helper function to emit events through the app handle
fn emit_event(app_handle: &AppHandle, event_name: &str) {
    if let Some(handle) = app_handle {
        if let Err(e) = handle.emit_event(event_name) {
            tracing::warn!("Failed to emit event {}: {}", event_name, e);
        }
    }
}

// Helper function to emit progress events with payload
fn emit_progress_event(
    app_handle: &AppHandle,
    bytes_transferred: u64,
    total_bytes: u64,
    speed_bps: f64,
) {
    if let Some(handle) = app_handle {
        let event_name = "receive-progress";

        // Convert speed to integer (multiply by 1000 to preserve 3 decimal places)
        let speed_int = (speed_bps * 1000.0) as i64;

        // Create payload data as colon-separated string
        let payload = format!("{}:{}:{}", bytes_transferred, total_bytes, speed_int);

        // Emit the event with appropriate payload
        if let Err(e) = handle.emit_event_with_payload(event_name, &payload) {
            tracing::warn!("Failed to emit progress event: {}", e);
        }
    }
}

// Helper function to emit events with payload
fn emit_event_with_payload(app_handle: &AppHandle, event_name: &str, payload: &str) {
    if let Some(handle) = app_handle {
        if let Err(e) = handle.emit_event_with_payload(event_name, payload) {
            tracing::warn!("Failed to emit event {} with payload: {}", event_name, e);
        }
    }
}

/// # Description
/// Receives metadata. This function will connect to the sender, request metadata, and return it without downloading
/// the file data.
/// # Returns
/// A `FileMetadata` struct containing the file name, size, thumbnail (if any), and MIME type (if any).
async fn receive_metadata<S: AsyncReadExt + Unpin>(
    stream: &mut S,
    app_handle: &AppHandle,
) -> anyhow::Result<FileMetadata> {
    // Read the length of the metadata (first 4 bytes)
    let mut len_buf = [0u8; 4];
    stream
        .read_exact(&mut len_buf)
        .await
        .map_err(|e| anyhow::anyhow!("metadata read length failed: {e}"))?;
    let meta_len = u32::from_be_bytes(len_buf) as usize;
    tracing::debug!(meta_len, "receive_metadata: length prefix received");

    const MAX_METADATA_BYTES: usize = 8 * 1024 * 1024;
    anyhow::ensure!(
        meta_len > 0 && meta_len <= MAX_METADATA_BYTES,
        "invalid metadata length: {meta_len}"
    );

    // Read the metadata JSON based on the length
    let mut meta_buf = vec![0u8; meta_len];
    stream
        .read_exact(&mut meta_buf)
        .await
        .map_err(|e| anyhow::anyhow!("metadata read body failed: {e}"))?;
    tracing::debug!(bytes = meta_buf.len(), "receive_metadata: body received");

    // Deserialize the metadata from JSON
    let metadata: FileMetadata = serde_json::from_slice(&meta_buf)
        .map_err(|e| anyhow::anyhow!("metadata json decode failed: {e}"))?;

    // Emit event with file metadata
    if let Some(emitter) = app_handle {
        if let Ok(payload) = serde_json::to_string(&metadata) {
            if let Err(e) = emitter.emit_event_with_payload("receive-file-metadata", &payload) {
                tracing::warn!("Failed to emit file metadata event: {}", e);
            }
        } else {
            tracing::warn!("Failed to serialize file metadata for event payload");
        }
    }

    Ok(metadata)
}

pub async fn download(
    ticket_str: String,
    options: ReceiveOptions,
    app_handle: AppHandle,
) -> anyhow::Result<ReceiveResult> {
    let ticket = BlobTicket::from_str(&ticket_str)?;

    let addr = ticket.addr().clone();

    let secret_key = get_or_create_secret()?;

    let mut builder = Endpoint::builder()
        .alpns(vec![])
        .secret_key(secret_key)
        .relay_mode(options.relay_mode.clone().into());

    if ticket.addr().relay_urls().count() == 0 && ticket.addr().ip_addrs().count() == 0 {
        builder = builder.discovery(DnsDiscovery::n0_dns());
    }
    if let Some(addr) = options.magic_ipv4_addr {
        builder = builder.bind_addr_v4(addr);
    }
    if let Some(addr) = options.magic_ipv6_addr {
        builder = builder.bind_addr_v6(addr);
    }

    let endpoint = builder.bind().await?;

    // Use system temp directory instead of current_dir for GUI app
    // This avoids polluting user directories and OS manages cleanup automatically
    let dir_name = format!(".sendme-recv-{}", ticket.hash().to_hex());
    let temp_base = std::env::temp_dir();
    let iroh_data_dir = temp_base.join(&dir_name);
    let db = FsStore::load(&iroh_data_dir).await?;
    let db2 = db.clone();

    let fut = async move {
        let hash_and_format = ticket.hash_and_format();
        let local = db.remote().local(hash_and_format).await?;

        let (stats, total_files, payload_size) = if !local.is_complete() {
            // Emit receive-started event
            emit_event(&app_handle, "receive-started");

            let connection = match endpoint
                .connect(addr.clone(), iroh_blobs::protocol::ALPN)
                .await
            {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Connection failed: {}", e);
                    tracing::error!("Error details: {:?}", e);
                    tracing::error!("Tried to connect to node: {}", addr.id);
                    tracing::error!("With relay: {:?}", addr.relay_urls().collect::<Vec<_>>());
                    tracing::error!(
                        "With direct addrs: {:?}",
                        addr.ip_addrs().collect::<Vec<_>>()
                    );
                    return Err(anyhow::anyhow!("Connection failed: {}", e));
                }
            };

            let sizes_result =
                get_hash_seq_and_sizes(&connection, &hash_and_format.hash, 1024 * 1024 * 32, None)
                    .await;

            let (_hash_seq, sizes) = match sizes_result {
                Ok((hash_seq, sizes)) => (hash_seq, sizes),
                Err(e) => {
                    tracing::error!("Failed to get sizes: {:?}", e);
                    tracing::error!("Error type: {}", std::any::type_name_of_val(&e));
                    return Err(show_get_error(e).into());
                }
            };
            let _total_size = sizes.iter().copied().sum::<u64>();
            // For payload size, we want the actual file data size
            // The sizes array contains: [collection_size, file1_size, file2_size, ...]
            // We skip the first element (collection metadata) but include all file sizes
            let payload_size = sizes.iter().skip(1).copied().sum::<u64>();
            let total_files = (sizes.len().saturating_sub(1)) as u64;

            // Emit initial progress event (0%) so frontend can display total size immediately
            emit_progress_event(&app_handle, 0, payload_size, 0.0);

            let _local_size = local.local_bytes();
            let get = db.remote().execute_get(connection, local.missing());
            let mut stats = Stats::default();
            let mut stream = get.stream();
            let mut last_log_offset = 0u64;
            let transfer_start_time = Instant::now();

            while let Some(item) = stream.next().await {
                match item {
                    GetProgressItem::Progress(offset) => {
                        // Emit progress events every 1MB
                        if offset - last_log_offset > 1_000_000 {
                            last_log_offset = offset;

                            // Calculate speed and emit progress event
                            let elapsed = transfer_start_time.elapsed().as_secs_f64();
                            let speed_bps = if elapsed > 0.0 {
                                offset as f64 / elapsed
                            } else {
                                0.0
                            };

                            emit_progress_event(
                                &app_handle,
                                offset.min(payload_size),
                                payload_size,
                                speed_bps,
                            );
                        }
                    }
                    GetProgressItem::Done(value) => {
                        stats = value;

                        // Emit final progress event
                        let elapsed = transfer_start_time.elapsed().as_secs_f64();
                        let speed_bps = if elapsed > 0.0 {
                            payload_size as f64 / elapsed
                        } else {
                            0.0
                        };
                        emit_progress_event(&app_handle, payload_size, payload_size, speed_bps);

                        break;
                    }
                    GetProgressItem::Error(cause) => {
                        tracing::error!("Download error: {:?}", cause);
                        anyhow::bail!(show_get_error(cause));
                    }
                }
            }
            (stats, total_files, payload_size)
        } else {
            let total_files = local.children().unwrap() - 1;
            let payload_bytes = 0; // todo local.sizes().skip(2).map(Option::unwrap).sum::<u64>();

            // Emit events for already complete data
            emit_event(&app_handle, "receive-started");
            emit_event(&app_handle, "receive-completed");

            (Stats::default(), total_files, payload_bytes)
        };

        let collection = Collection::load(hash_and_format.hash, db.as_ref()).await?;

        // Extract file names from collection and emit them BEFORE export
        // This allows the UI to show file names during the export phase
        let mut file_names: Vec<String> = Vec::new();
        for (name, _hash) in collection.iter() {
            file_names.push(name.to_string());
        }

        // Emit file names information
        if !file_names.is_empty() {
            let file_names_json =
                serde_json::to_string(&file_names).unwrap_or_else(|_| "[]".to_string());
            emit_event_with_payload(&app_handle, "receive-file-names", &file_names_json);
        }

        // Determine output directory
        let output_dir = options.output_dir.unwrap_or_else(|| {
            dirs::download_dir().unwrap_or_else(|| std::env::current_dir().unwrap())
        });

        export(&db, collection, &output_dir).await?;

        // Emit completion event AFTER everything is done
        emit_event(&app_handle, "receive-completed");

        anyhow::Ok((total_files, payload_size, stats, output_dir))
    };

    let (total_files, payload_size, _stats, output_dir) = select! {
        x = fut => match x {
            Ok(x) => x,
            Err(e) => {
                tracing::error!("Download operation failed: {}", e);
                // make sure we shutdown the db before exiting
                db2.shutdown().await?;
                anyhow::bail!("error: {e}");
            }
        },
        _ = tokio::signal::ctrl_c() => {
            tracing::warn!("Operation cancelled by user");
            db2.shutdown().await?;
            anyhow::bail!("Operation cancelled");
        }
    };

    tokio::fs::remove_dir_all(&iroh_data_dir).await?;

    Ok(ReceiveResult {
        message: format!("Downloaded {} files, {} bytes", total_files, payload_size),
        file_path: output_dir,
    })
}

/// # Description
/// Fetches metadata for a given ticket without downloading the file data. This is used to display file information (name, size, thumbnail) in the UI before the user decides to download.
/// # Returns
/// A `FileMetadata` struct containing the file name, size, and preview metadata (if any).
pub async fn fetch_metadata(
    ticket_str: String,
    options: ReceiveOptions,
) -> anyhow::Result<FileMetadata> {
    // parse ticket and extract address
    let ticket = BlobTicket::from_str(&ticket_str)?;
    let addr = ticket.addr().clone();

    // Create a temporary endpoint to connect and fetch metadata
    let secret_key = get_or_create_secret()?;

    let mut builder = Endpoint::builder()
        // METADATA_ALPN only to indicate a metadata fetch
        .alpns(vec![METADATA_ALPN.to_vec()])
        .secret_key(secret_key)
        .relay_mode(options.relay_mode.into());

    if ticket.addr().relay_urls().count() == 0 && ticket.addr().ip_addrs().count() == 0 {
        builder = builder.discovery(DnsDiscovery::n0_dns());
    }
    if let Some(addr) = options.magic_ipv4_addr {
        builder = builder.bind_addr_v4(addr);
    }
    if let Some(addr) = options.magic_ipv6_addr {
        builder = builder.bind_addr_v6(addr);
    }

    let endpoint = builder.bind().await?;

    // Attempt connection and metadata fetch up to 3 times
    let mut attempt_plan: Vec<(usize, &'static str, iroh::EndpointAddr)> = vec![
        (1, "default", addr.clone()),
        (2, "default", addr.clone()),
        (3, "default", addr.clone()),
    ];

    // Relay-only attempt if relay addresses are avaliable
    let mut relay_only_addr = addr.clone();
    relay_only_addr
        .addrs
        .retain(|transport_addr| matches!(transport_addr, TransportAddr::Relay(_)));
    if !relay_only_addr.addrs.is_empty() {
        attempt_plan[2] = (3, "relay-only", relay_only_addr);
    }

    let mut last_error: Option<anyhow::Error> = None;

    for (attempt, path, target_addr) in attempt_plan {
        tracing::info!(attempt, path, "fetch_metadata: connecting to sender");

        let result = async {
            let connection = timeout(
                Duration::from_secs(15),
                endpoint.connect(target_addr, METADATA_ALPN),
            )
            .await
            .map_err(|_| anyhow::anyhow!("metadata connect timeout"))??;

            tracing::debug!(attempt, path, "fetch_metadata: connection established");

            let (mut send_stream, mut recv_stream) =
                timeout(Duration::from_secs(20), connection.open_bi())
                    .await
                    .map_err(|_| anyhow::anyhow!("metadata open_bi timeout"))??;

            tracing::debug!(attempt, path, "fetch_metadata: bi stream opened");

            // Send 1 byte as a marker to indicate metadata request
            timeout(Duration::from_secs(10), send_stream.write_all(&[1]))
                .await
                .map_err(|_| anyhow::anyhow!("metadata request write timeout"))??;

            tracing::debug!(attempt, path, "fetch_metadata: request marker sent");

            let metadata = timeout(
                Duration::from_secs(20),
                receive_metadata(&mut recv_stream, &None),
            )
            .await
            .map_err(|_| anyhow::anyhow!("metadata read timeout"))??;

            // Finish send_stream only AFTER receiving the metadata.
            // signals the server that we are safely done and it can drop the connection.
            let _ = send_stream.finish();

            Ok(metadata)
        }
        .await;

        match result {
            Ok(metadata) => {
                tracing::info!(
                    attempt,
                    path,
                    file_name = %metadata.file_name,
                    size = metadata.size,
                    "fetch_metadata: received metadata"
                );
                endpoint.close().await;
                return Ok(metadata);
            }
            Err(err) => {
                tracing::warn!(attempt, path, error = %err, "fetch_metadata attempt failed");
                last_error = Some(err);
                if attempt < 3 {
                    tokio::time::sleep(Duration::from_millis(300)).await;
                }
            }
        }
    }

    endpoint.close().await;
    Err(last_error.unwrap_or_else(|| anyhow::anyhow!("metadata fetch failed")))
}

async fn export(db: &Store, collection: Collection, output_dir: &Path) -> anyhow::Result<()> {
    for (_i, (name, hash)) in collection.iter().enumerate() {
        let target = get_export_path(output_dir, name)?;
        if target.exists() {
            anyhow::bail!("target {} already exists", target.display());
        }
        let mut stream = db
            .export_with_opts(ExportOptions {
                hash: *hash,
                target,
                mode: ExportMode::Copy,
            })
            .stream()
            .await;

        while let Some(item) = stream.next().await {
            match item {
                ExportProgressItem::Size(_size) => {
                    // Skip progress updates for library version
                }
                ExportProgressItem::CopyProgress(_offset) => {
                    // Skip progress updates for library version
                }
                ExportProgressItem::Done => {
                    // Export completed
                }
                ExportProgressItem::Error(cause) => {
                    anyhow::bail!("error exporting {}: {}", name, cause);
                }
            }
        }
    }
    Ok(())
}

fn get_export_path(root: &Path, name: &str) -> anyhow::Result<PathBuf> {
    let parts = name.split('/');
    let mut path = root.to_path_buf();
    for part in parts {
        validate_path_component(part)?;
        path.push(part);
    }
    Ok(path)
}

fn validate_path_component(component: &str) -> anyhow::Result<()> {
    anyhow::ensure!(!component.is_empty(), "empty path component");
    anyhow::ensure!(!component.contains('/'), "contains /");
    anyhow::ensure!(!component.contains('\\'), "contains \\");
    anyhow::ensure!(!component.contains(':'), "contains colon");
    anyhow::ensure!(component != "..", "parent directory traversal");
    anyhow::ensure!(component != ".", "current directory reference");
    anyhow::ensure!(!component.contains('\0'), "contains null byte");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_fetch_metadata_e2e() {
        use crate::core::send::start_share;
        use crate::core::types::{
            AddrInfoOptions, FileMetadata, ReceiveOptions, RelayModeOption, SendOptions,
        };
        use std::io::Write;
        use tempfile::NamedTempFile;

        // Create a dummy file to share
        let mut temp_file = NamedTempFile::new().unwrap();
        write!(temp_file, "metadata e2e test content").unwrap();
        let temp_path = temp_file.path().to_path_buf();

        // Setup metadata
        let expected_metadata = FileMetadata {
            file_name: "test_e2e_file.txt".into(),
            size: 25,
            thumbnail: Some("data:image/jpeg;base64,e2e_test_thumbnail=".into()),
            mime_type: Some("text/plain".into()),
        };

        let send_opts = SendOptions {
            relay_mode: RelayModeOption::Default,
            ticket_type: AddrInfoOptions::RelayAndAddresses,
            magic_ipv4_addr: None,
            magic_ipv6_addr: None,
        };

        // Start share
        let result = start_share(temp_path, send_opts, None, Some(expected_metadata.clone()))
            .await
            .expect("Failed to start share");

        // Fetch metadata via ALPN protocol
        let recv_opts = ReceiveOptions {
            output_dir: None,
            relay_mode: RelayModeOption::Default,
            magic_ipv4_addr: None,
            magic_ipv6_addr: None,
        };

        let fetched = fetch_metadata(result.ticket, recv_opts)
            .await
            .expect("Failed to fetch metadata from node");

        // Verify received data matches exactly
        assert_eq!(fetched.file_name, expected_metadata.file_name);
        assert_eq!(fetched.size, expected_metadata.size);
        assert_eq!(fetched.thumbnail, expected_metadata.thumbnail);
        assert_eq!(fetched.mime_type, expected_metadata.mime_type);
    }

    #[test]
    fn validate_rejects_empty() {
        assert!(validate_path_component("").is_err());
    }

    #[test]
    fn validate_rejects_slash() {
        assert!(validate_path_component("a/b").is_err());
    }

    #[test]
    fn validate_rejects_backslash() {
        assert!(validate_path_component("a\\b").is_err());
    }

    #[test]
    fn validate_rejects_parent_traversal() {
        assert!(validate_path_component("..").is_err());
    }

    #[test]
    fn validate_rejects_dot() {
        assert!(validate_path_component(".").is_err());
    }

    #[test]
    fn validate_rejects_null_byte() {
        assert!(validate_path_component("a\0b").is_err());
    }

    #[test]
    fn validate_rejects_colon() {
        assert!(validate_path_component("C:foo").is_err());
    }

    #[test]
    fn validate_accepts_normal() {
        assert!(validate_path_component("file.txt").is_ok());
        assert!(validate_path_component("my-file_v2.tar.gz").is_ok());
    }

    #[test]
    fn get_export_path_blocks_drive_prefix() {
        let root = Path::new("/tmp/test");
        assert!(get_export_path(root, "C:foo").is_err());
    }

    #[test]
    fn get_export_path_blocks_traversal() {
        let root = Path::new("/tmp/test");
        assert!(get_export_path(root, "../etc/passwd").is_err());
        assert!(get_export_path(root, "subdir/../../etc/passwd").is_err());
    }

    #[test]
    fn get_export_path_blocks_backslash() {
        assert!(get_export_path(Path::new("/tmp/test"), "file\\name").is_err());
    }

    #[test]
    fn get_export_path_allows_normal() {
        let p = get_export_path(Path::new("/tmp/test"), "subdir/file.txt").unwrap();
        assert_eq!(p, PathBuf::from("/tmp/test/subdir/file.txt"));
    }
}

fn show_get_error(e: GetError) -> GetError {
    match &e {
        GetError::InitialNext { source, .. } => {
            tracing::error!("initial connection error: {source}");
        }
        GetError::ConnectedNext { source, .. } => {
            tracing::error!("connected error: {source}");
        }
        GetError::AtBlobHeaderNext { source, .. } => {
            tracing::error!("reading blob header error: {source}");
        }
        GetError::Decode { source, .. } => {
            tracing::error!("decoding error: {source}");
        }
        GetError::IrpcSend { source, .. } => {
            tracing::error!("error sending over irpc: {source}");
        }
        GetError::AtClosingNext { source, .. } => {
            tracing::error!("error at closing: {source}");
        }
        GetError::BadRequest { .. } => {
            tracing::error!("bad request");
        }
        GetError::LocalFailure { source, .. } => {
            tracing::error!("local failure {source:?}");
        }
    }
    e
}
