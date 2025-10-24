use crate::core::types::{ReceiveResult, ReceiveOptions, get_or_create_secret, AppHandle};
use iroh::{
    discovery::dns::DnsDiscovery,
    Endpoint,
};
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
use std::path::{Path, PathBuf};
use std::time::Instant;
use tokio::select;
use n0_future::StreamExt;
use std::str::FromStr;

// Helper function to emit events through the app handle
fn emit_event(app_handle: &AppHandle, event_name: &str) {
    if let Some(handle) = app_handle {
        if let Err(e) = handle.emit_event(event_name) {
            tracing::warn!("Failed to emit event {}: {}", event_name, e);
        }
    }
}

// Helper function to emit progress events with payload
fn emit_progress_event(app_handle: &AppHandle, bytes_transferred: u64, total_bytes: u64, speed_bps: f64) {
    if let Some(handle) = app_handle {
        // Use a consistent event name
        let event_name = "receive-progress";
        
        // Convert speed to integer (multiply by 1000 to preserve 3 decimal places)
        let speed_int = (speed_bps * 1000.0) as i64;
        
        // Create payload data as colon-separated string
        let payload = format!("{}:{}:{}", bytes_transferred, total_bytes, speed_int);
        
        // Emit the event with proper payload
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

/// Receive a file or directory using a ticket
pub async fn download(ticket_str: String, options: ReceiveOptions, app_handle: AppHandle) -> anyhow::Result<ReceiveResult> {
    tracing::info!("🎫 Starting download with ticket: {}", &ticket_str[..50.min(ticket_str.len())]);
    
    let ticket = BlobTicket::from_str(&ticket_str)?;
    tracing::info!("✅ Ticket parsed successfully");
    
    let addr = ticket.node_addr().clone();
    tracing::info!("📍 Target node info:");
    tracing::info!("  - Node ID: {}", addr.node_id);
    tracing::info!("  - Relay URL: {:?}", addr.relay_url);
    tracing::info!("  - Direct addresses: {:?}", addr.direct_addresses);
    tracing::info!("  - Hash: {}", ticket.hash());
    
    let secret_key = get_or_create_secret()?;
    tracing::info!("🔑 Generated/loaded secret key");
    
    let mut builder = Endpoint::builder()
        .alpns(vec![])
        .secret_key(secret_key)
        .relay_mode(options.relay_mode.clone().into());
    
    tracing::info!("🔧 Relay mode: {:?}", options.relay_mode);

    if ticket.node_addr().relay_url.is_none() && ticket.node_addr().direct_addresses.is_empty() {
        tracing::info!("🔍 No relay/addresses in ticket, adding DNS discovery");
        builder = builder.add_discovery(DnsDiscovery::n0_dns());
    }
    if let Some(addr) = options.magic_ipv4_addr {
        tracing::info!("🌐 Binding to IPv4: {}", addr);
        builder = builder.bind_addr_v4(addr);
    }
    if let Some(addr) = options.magic_ipv6_addr {
        tracing::info!("🌐 Binding to IPv6: {}", addr);
        builder = builder.bind_addr_v6(addr);
    }
    
    tracing::info!("🚀 Creating endpoint...");
    let endpoint = builder.bind().await?;
    tracing::info!("✅ Endpoint created successfully");
    tracing::info!("📡 Endpoint bound successfully");
    
    // Use system temp directory instead of current_dir for GUI app
    let dir_name = format!(".sendme-recv-{}", ticket.hash().to_hex());
    let temp_base = std::env::temp_dir();
    let iroh_data_dir = temp_base.join(&dir_name);
    tracing::info!("💾 Storage directory: {}", iroh_data_dir.display());
    let db = FsStore::load(&iroh_data_dir).await?;
    let db2 = db.clone();
    
    tracing::info!("✅ Database loaded");
    let fut = async move {
        tracing::info!("🔄 Starting download process...");
        let hash_and_format = ticket.hash_and_format();
        tracing::info!("📦 Checking local data for hash: {}", hash_and_format.hash);
        let local = db.remote().local(hash_and_format).await?;
        tracing::info!("✅ Local check complete");
        
        let (stats, total_files, payload_size) = if !local.is_complete() {
            tracing::info!("⬇️  Data not complete locally, starting download...");
            tracing::info!("🔌 Attempting to connect to sender...");
            tracing::info!("   Target: {}", addr.node_id);
            tracing::info!("   ALPN: {:?}", iroh_blobs::protocol::ALPN);
            
            // Emit receive-started event
            emit_event(&app_handle, "receive-started");
            
            let connection = match endpoint.connect(addr.clone(), iroh_blobs::protocol::ALPN).await {
                Ok(conn) => {
                    tracing::info!("✅ Connection established successfully!");
                    tracing::info!("   Connection established to node: {}", addr.node_id);
                    conn
                }
                Err(e) => {
                    tracing::error!("❌ Connection failed: {}", e);
                    tracing::error!("   Error details: {:?}", e);
                    tracing::error!("   Tried to connect to node: {}", addr.node_id);
                    tracing::error!("   With relay: {:?}", addr.relay_url);
                    tracing::error!("   With direct addrs: {:?}", addr.direct_addresses);
                    return Err(anyhow::anyhow!("Connection failed: {}", e));
                }
            };
            tracing::info!("📊 Getting file sizes...");
            tracing::info!("   Hash: {}", hash_and_format.hash);
            tracing::info!("   Connection: {:?}", connection);
            
            let sizes_result = get_hash_seq_and_sizes(&connection, &hash_and_format.hash, 1024 * 1024 * 32, None).await;
            
            let (_hash_seq, sizes) = match sizes_result {
                Ok((hash_seq, sizes)) => {
                    tracing::info!("✅ Successfully got sizes: {} items", sizes.len());
                    tracing::info!("   Hash sequence: {:?}", hash_seq);
                    tracing::info!("   Sizes: {:?}", sizes);
                    (hash_seq, sizes)
                }
                Err(e) => {
                    tracing::error!("❌ Failed to get sizes: {:?}", e);
                    tracing::error!("   Error type: {}", std::any::type_name_of_val(&e));
                    return Err(show_get_error(e).into());
                }
            };
            let _total_size = sizes.iter().copied().sum::<u64>();
            // For payload size, we want the actual file data size
            // The sizes array contains: [collection_size, file1_size, file2_size, ...]
            // We skip the first element (collection metadata) but include all file sizes
            let payload_size = sizes.iter().skip(1).copied().sum::<u64>();
            let total_files = (sizes.len().saturating_sub(1)) as u64;
            
            tracing::info!("📦 File info: {} files, {} bytes total", total_files, payload_size);
            
            // Track local size for resumable downloads (CLI implementation)
            let local_size = local.local_bytes();
            if local_size > 0 {
                tracing::info!("🔄 Resuming download from {} bytes ({}% complete)", 
                    local_size, 
                    (local_size as f64 / payload_size as f64 * 100.0) as u64
                );
                // Emit event to indicate resume
                emit_event_with_payload(&app_handle, "receive-resumed", &format!("{}", local_size));
            }
            
            // Emit initial progress event with local_size so frontend shows correct starting point
            emit_progress_event(&app_handle, local_size, payload_size, 0.0);
            
            tracing::info!("⬇️  Starting data transfer...");
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
                            tracing::info!("📥 Downloaded: {} bytes (total: {} bytes)", offset, local_size + offset);
                            last_log_offset = offset;
                            
                            // Calculate speed and emit progress event with local_size included (CLI implementation)
                            let elapsed = transfer_start_time.elapsed().as_secs_f64();
                            let speed_bps = if elapsed > 0.0 {
                                offset as f64 / elapsed
                            } else {
                                0.0
                            };
                            
                            emit_progress_event(&app_handle, local_size + offset, payload_size, speed_bps);
                        }
                    }
                    GetProgressItem::Done(value) => {
                        tracing::info!("✅ Download complete!");
                        stats = value;
                        
                        // Emit final progress event (100% complete)
                        let elapsed = transfer_start_time.elapsed().as_secs_f64();
                        let total_downloaded = stats.total_bytes_read();
                        let speed_bps = if elapsed > 0.0 {
                            total_downloaded as f64 / elapsed
                        } else {
                            0.0
                        };
                        emit_progress_event(&app_handle, payload_size, payload_size, speed_bps);
                        
                        break;
                    }
                    GetProgressItem::Error(cause) => {
                        tracing::error!("❌ Download error: {:?}", cause);
                        anyhow::bail!(show_get_error(cause));
                    }
                }
            }
            (stats, total_files, payload_size)
        } else {
            tracing::info!("✅ Data already complete locally!");
            let total_files = local.children().unwrap() - 1;
            let payload_bytes = 0; // todo local.sizes().skip(2).map(Option::unwrap).sum::<u64>();
            
            // Emit events for already complete data
            emit_event(&app_handle, "receive-started");
            emit_event(&app_handle, "receive-completed");
            
            (Stats::default(), total_files, payload_bytes)
        };
        
        tracing::info!("📂 Loading collection...");
        let collection = Collection::load(hash_and_format.hash, db.as_ref()).await?;
        tracing::info!("✅ Collection loaded: {} items", collection.len());
        
        // Extract file names from collection and emit them BEFORE export
        // This allows the UI to show file names during the export phase
        let mut file_names: Vec<String> = Vec::new();
        for (name, _hash) in collection.iter() {
            file_names.push(name.to_string());
        }
        
        // Emit file names information
        if !file_names.is_empty() {
            let file_names_json = serde_json::to_string(&file_names)
                .unwrap_or_else(|_| "[]".to_string());
            emit_event_with_payload(&app_handle, "receive-file-names", &file_names_json);
        }
        
        // Determine output directory
        let output_dir = options.output_dir.unwrap_or_else(|| {
            dirs::download_dir().unwrap_or_else(|| std::env::current_dir().unwrap())
        });
        
        tracing::info!("📁 Exporting to: {}", output_dir.display());
        export(&db, collection, &output_dir, &app_handle).await?;
        tracing::info!("✅ Export complete!");
        
        // Emit completion event AFTER everything is done
        emit_event(&app_handle, "receive-completed");
        
        anyhow::Ok((total_files, payload_size, stats, output_dir))
    };
    
    let (total_files, payload_size, _stats, output_dir) = select! {
        x = fut => match x {
            Ok(x) => {
                tracing::info!("✅ Download operation completed successfully");
                x
            },
            Err(e) => {
                tracing::error!("❌ Download operation failed: {}", e);
                // make sure we shutdown the db before exiting
                db2.shutdown().await?;
                anyhow::bail!("error: {e}");
            }
        },
        _ = tokio::signal::ctrl_c() => {
            tracing::warn!("⚠️  Operation cancelled by user");
            db2.shutdown().await?;
            anyhow::bail!("Operation cancelled");
        }
    };
    
    tracing::info!("🧹 Cleaning up temporary directory...");
    // Best effort cleanup - don't fail on cleanup error
    if let Err(e) = tokio::fs::remove_dir_all(&iroh_data_dir).await {
        tracing::warn!("⚠️  Failed to clean up temporary directory {}: {}", iroh_data_dir.display(), e);
        // Continue anyway - cleanup is best effort
    } else {
        tracing::info!("✅ Temporary directory cleaned up successfully");
    }
    
    Ok(ReceiveResult {
        message: format!("Downloaded {} files, {} bytes", total_files, payload_size),
        file_path: output_dir,
    })
}

async fn export(db: &Store, collection: Collection, output_dir: &Path, app_handle: &AppHandle) -> anyhow::Result<()> {
    let total_files = collection.len();
    tracing::info!("📤 Starting export of {} files to {}", total_files, output_dir.display());
    
    // Emit export-started event
    emit_event_with_payload(app_handle, "export-started", &format!("{}", total_files));
    
    for (i, (name, hash)) in collection.iter().enumerate() {
        let target = get_export_path(output_dir, name)?;
        if target.exists() {
            anyhow::bail!("target {} already exists", target.display());
        }
        
        // Emit progress for each file being exported
        let progress = ((i + 1) as f64 / total_files as f64 * 100.0) as u64;
        emit_event_with_payload(app_handle, "export-progress", &format!("{}:{}:{}", i + 1, total_files, progress));
        tracing::info!("📤 Exporting file {}/{}: {}", i + 1, total_files, name);
        
        let mut stream = db
            .export_with_opts(ExportOptions {
                hash: *hash,
                target: target.clone(),
                mode: ExportMode::Copy,
            })
            .stream()
            .await;
        
        let mut file_size = 0u64;
        while let Some(item) = stream.next().await {
            match item {
                ExportProgressItem::Size(size) => {
                    file_size = size;
                    tracing::debug!("   File size: {} bytes", size);
                }
                ExportProgressItem::CopyProgress(offset) => {
                    // Log progress for debugging but don't emit to UI (too frequent)
                    tracing::debug!("   Export progress: {} / {} bytes", offset, file_size);
                }
                ExportProgressItem::Done => {
                    tracing::info!("   ✅ Exported {} ({} bytes)", name, file_size);
                }
                ExportProgressItem::Error(cause) => {
                    anyhow::bail!("error exporting {}: {}", name, cause);
                }
            }
        }
    }
    
    // Emit export-completed event
    emit_event(app_handle, "export-completed");
    tracing::info!("✅ Export completed successfully");
    
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
    anyhow::ensure!(
        !component.contains('/'),
        "path components must not contain the only correct path separator, /"
    );
    Ok(())
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
