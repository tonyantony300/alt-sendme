use crate::core::types::{SendResult, SendOptions, AddrInfoOptions, apply_options, get_or_create_secret, AppHandle};
use anyhow::Context;
use data_encoding::HEXLOWER;
use iroh::{
    discovery::pkarr::PkarrPublisher,
    Endpoint, RelayMode,
};
use iroh_blobs::{
    api::{
        blobs::{AddPathOptions, ImportMode},
        Store, TempTag,
    },
    format::collection::Collection,
    provider::{
        events::{ConnectMode, EventMask, EventSender, RequestMode},
    },
    store::fs::FsStore,
    ticket::BlobTicket,
    BlobFormat, BlobsProtocol,
};
use n0_future::{task::AbortOnDropHandle, BufferedStreamExt};
use rand::Rng;
use std::{
    path::{Component, Path, PathBuf},
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::{select, sync::mpsc};
use tracing::trace;
use walkdir::WalkDir;
use n0_future::StreamExt;

fn emit_event(app_handle: &AppHandle, event_name: &str) {
    if let Some(handle) = app_handle {
        if let Err(e) = handle.emit_event(event_name) {
            // tracing::warn!("Failed to emit event {}: {}", event_name, e);
        }
    }
}

fn emit_event_with_payload(app_handle: &AppHandle, event_name: &str, payload: &str) {
    if let Some(handle) = app_handle {
        if let Err(e) = handle.emit_event_with_payload(event_name, payload) {
            // tracing::warn!("Failed to emit event {} with payload: {}", event_name, e);
        }
    }
}

fn emit_progress_event(app_handle: &AppHandle, bytes_transferred: u64, total_bytes: u64, speed_bps: f64) {
    if let Some(handle) = app_handle {
        let event_name = "transfer-progress";
        
        let speed_int = (speed_bps * 1000.0) as i64;
        
        let payload = format!("{}:{}:{}", bytes_transferred, total_bytes, speed_int);
        
        if let Err(e) = handle.emit_event_with_payload(event_name, &payload) {
            // tracing::warn!("Failed to emit progress event: {}", e);
        }
    }
}

pub async fn start_share(path: PathBuf, options: SendOptions, app_handle: AppHandle) -> anyhow::Result<SendResult> {
    // tracing::info!("🚀 Starting share for path: {}", path.display());
    
    let secret_key = get_or_create_secret()?;
    let node_id = secret_key.public();
    // tracing::info!("🔑 Node ID: {}", node_id);
    
    let relay_mode: RelayMode = options.relay_mode.clone().into();
    // tracing::info!("🔧 Relay mode: {:?}", options.relay_mode);
    
    let mut builder = Endpoint::builder()
        .alpns(vec![iroh_blobs::protocol::ALPN.to_vec()])
        .secret_key(secret_key)
        .relay_mode(relay_mode.clone());
    
    if options.ticket_type == AddrInfoOptions::Id {
        // tracing::info!("🔍 Adding DNS discovery (ticket type: Id)");
        builder = builder.add_discovery(PkarrPublisher::n0_dns());
    }
    if let Some(addr) = options.magic_ipv4_addr {
        // tracing::info!("🌐 Binding to IPv4: {}", addr);
        builder = builder.bind_addr_v4(addr);
    }
    if let Some(addr) = options.magic_ipv6_addr {
        // tracing::info!("🌐 Binding to IPv6: {}", addr);
        builder = builder.bind_addr_v6(addr);
    }

    let suffix = rand::rng().random::<[u8; 16]>();
    let temp_base = std::env::temp_dir();
    let blobs_data_dir = temp_base.join(format!(".sendme-send-{}", HEXLOWER.encode(&suffix)));
    // tracing::info!("💾 Blob storage directory: {}", blobs_data_dir.display());
    if blobs_data_dir.exists() {
        anyhow::bail!(
            "can not share twice from the same directory: {}",
            temp_base.display(),
        );
    }
    let cwd = std::env::current_dir()?;
    if cwd.join(&path) == cwd {
        anyhow::bail!("can not share from the current directory");
    }

    let path2 = path.clone();
    let blobs_data_dir2 = blobs_data_dir.clone();
    let (progress_tx, progress_rx) = mpsc::channel(32);
    let app_handle_clone = app_handle.clone();
    
    let setup = async move {
        let t0 = Instant::now();
        // tracing::info!("📁 Creating blob storage directory...");
        tokio::fs::create_dir_all(&blobs_data_dir2).await?;

        // tracing::info!("🔌 Binding endpoint...");
        let endpoint = builder.bind().await?;
        // tracing::info!("✅ Endpoint created successfully");
        // tracing::info!("📡 Endpoint bound successfully");
        
        // tracing::info!("💾 Loading file store...");
        let store = FsStore::load(&blobs_data_dir2).await?;
        
        // tracing::info!("🔧 Initializing blobs protocol...");
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
        // tracing::info!("✅ Blobs protocol initialized with event logging enabled");
        // tracing::info!("📊 Store loaded successfully");

        // tracing::info!("📦 Importing files...");
        let import_result = import(path2, blobs.store(), &app_handle_clone).await?;
        let dt = t0.elapsed();
        // tracing::info!("✅ Import complete in {:?}", dt);

        let (ref _temp_tag, size, ref _collection) = import_result;
        let progress_handle = n0_future::task::spawn(show_provide_progress_with_logging(
            progress_rx,
            app_handle_clone,
            size, // Pass the total file size
        ));

        // tracing::info!("🌐 Starting protocol router...");
        let router = iroh::protocol::Router::builder(endpoint)
            .accept(iroh_blobs::ALPN, blobs.clone())
            .spawn();

        let ep = router.endpoint();
        // tracing::info!("🔗 Router endpoint info:");
        // tracing::info!("   Node ID: {}", ep.node_id());
        // tracing::info!("⏳ Waiting for endpoint to come online...");
        tokio::time::timeout(Duration::from_secs(30), async move {
            if !matches!(relay_mode, RelayMode::Disabled) {
                let _ = ep.online().await;
                // tracing::info!("✅ Endpoint is online");
            }
        })
        .await?;

        anyhow::Ok((router, import_result, dt, blobs_data_dir2, store, progress_handle))
    };
    
    let (router, (temp_tag, size, _collection), _dt, _blobs_data_dir, store, progress_handle) = select! {
        x = setup => x?,
        _ = tokio::signal::ctrl_c() => {
            anyhow::bail!("Operation cancelled");
        }
    };
    let hash = temp_tag.hash();
    // tracing::info!("🔐 Content hash: {}", hash);

    let mut addr = router.endpoint().node_addr();
    // tracing::info!("📍 Node address before options:");
    // tracing::info!("  - Node ID: {}", addr.node_id);
    // tracing::info!("  - Relay URL: {:?}", addr.relay_url);
    // tracing::info!("  - Direct addresses: {:?}", addr.direct_addresses);
    
    apply_options(&mut addr, options.ticket_type);
    // tracing::info!("📍 Node address after options (ticket type: {:?}):", options.ticket_type);
    // tracing::info!("  - Node ID: {}", addr.node_id);
    // tracing::info!("  - Relay URL: {:?}", addr.relay_url);
    // tracing::info!("  - Direct addresses: {:?}", addr.direct_addresses);
    
    let ticket = BlobTicket::new(addr, hash, BlobFormat::HashSeq);
    let entry_type = if path.is_file() { "file" } else { "directory" };
    
    // tracing::info!("🎫 Generated ticket: {}", ticket.to_string()[..80.min(ticket.to_string().len())].to_string());
    // tracing::info!("✅ Share started successfully! Entry type: {}, size: {} bytes", entry_type, size);
    // tracing::info!("🔄 Server is ready to accept connections...");
    // tracing::info!("📡 Listening for incoming requests...");

    Ok(SendResult {
        ticket: ticket.to_string(),
        hash: hash.to_hex().to_string(),
        size,
        entry_type: entry_type.to_string(),
        router,           // Keeps server running and protocols active
        temp_tag,         // Prevents data GC
        blobs_data_dir,   // For cleanup
        _progress_handle: AbortOnDropHandle::new(progress_handle), // Keeps event channel open
        _store: store,    // Keeps blob storage alive
    })
}

async fn import(
    path: PathBuf,
    db: &Store,
    app_handle: &AppHandle,
) -> anyhow::Result<(TempTag, u64, Collection)> {
    let parallelism = num_cpus::get();
    let path = path.canonicalize()?;
    anyhow::ensure!(path.exists(), "path {} does not exist", path.display());
    let root = path.parent().context("context get parent")?;
    let files = WalkDir::new(path.clone()).into_iter();
    let data_sources: Vec<(String, PathBuf)> = files
        .map(|entry| {
            let entry = entry?;
            if !entry.file_type().is_file() {
                return Ok(None);
            }
            let path = entry.into_path();
            let relative = path.strip_prefix(root)?;
            let name = canonicalized_path_to_string(relative, true)?;
            anyhow::Ok(Some((name, path)))
        })
        .filter_map(Result::transpose)
        .collect::<anyhow::Result<Vec<_>>>()?;
    
    let total_files = data_sources.len();
    // tracing::info!("📦 Importing {} files...", total_files);
    
    emit_event(app_handle, "import-started");
    emit_event_with_payload(app_handle, "import-file-count", &format!("{}", total_files));
    
    let files_processed = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let mut names_and_tags = n0_future::stream::iter(data_sources)
        .map(|(name, path)| {
            let db = db.clone();
            let app_handle = app_handle.clone();
            let files_processed = files_processed.clone();
            async move {
                // tracing::info!("📄 Importing file: {}", name);
                
                let import = db.add_path_with_opts(AddPathOptions {
                    path,
                    mode: ImportMode::TryReference,
                    format: iroh_blobs::BlobFormat::Raw,
                });
                let mut stream = import.stream().await;
                let mut item_size = 0;
                let temp_tag = loop {
                    let item = stream
                        .next()
                        .await
                        .context("import stream ended without a tag")?;
                    trace!("importing {name} {item:?}");
                    match item {
                        iroh_blobs::api::blobs::AddProgressItem::Size(size) => {
                            item_size = size;
                            // tracing::debug!("   Size: {} bytes", size);
                        }
                        iroh_blobs::api::blobs::AddProgressItem::CopyProgress(offset) => {
                            // tracing::debug!("   Copy progress: {} bytes", offset);
                        }
                        iroh_blobs::api::blobs::AddProgressItem::CopyDone => {
                            // tracing::debug!("   Copy done, computing outboard...");
                        }
                        iroh_blobs::api::blobs::AddProgressItem::OutboardProgress(offset) => {
                            // tracing::debug!("   Outboard progress: {} bytes", offset);
                        }
                        iroh_blobs::api::blobs::AddProgressItem::Error(cause) => {
                            anyhow::bail!("error importing {}: {}", name, cause);
                        }
                        iroh_blobs::api::blobs::AddProgressItem::Done(tt) => {
                            let processed = files_processed.fetch_add(1, std::sync::atomic::Ordering::Relaxed) + 1;
                            let progress = (processed as f64 / total_files as f64 * 100.0) as u64;
                            emit_event_with_payload(&app_handle, "import-progress", &format!("{}:{}:{}", processed, total_files, progress));
                            // tracing::info!("   ✅ Imported {} ({}/{} files, {} bytes)", name, processed, total_files, item_size);
                            break tt;
                        }
                    }
                };
                anyhow::Ok((name, temp_tag, item_size))
            }
        })
        .buffered_unordered(parallelism)
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .collect::<anyhow::Result<Vec<_>>>()?;
    
    names_and_tags.sort_by(|(a, _, _), (b, _, _)| a.cmp(b));
    let size = names_and_tags.iter().map(|(_, _, size)| *size).sum::<u64>();
    let (collection, tags) = names_and_tags
        .into_iter()
        .map(|(name, tag, _)| ((name, tag.hash()), tag))
        .unzip::<_, _, Collection, Vec<_>>();
    let temp_tag = collection.clone().store(db).await?;
    drop(tags);
    
    emit_event(app_handle, "import-completed");
    // tracing::info!("✅ Import completed: {} files, {} bytes total", total_files, size);
    
    Ok((temp_tag, size, collection))
}

pub fn canonicalized_path_to_string(
    path: impl AsRef<Path>,
    must_be_relative: bool,
) -> anyhow::Result<String> {
    let mut path_str = String::new();
    let parts = path
        .as_ref()
        .components()
        .filter_map(|c| match c {
            Component::Normal(x) => {
                let c = match x.to_str() {
                    Some(c) => c,
                    None => return Some(Err(anyhow::anyhow!("invalid character in path"))),
                };

                if !c.contains('/') && !c.contains('\\') {
                    Some(Ok(c))
                } else {
                    Some(Err(anyhow::anyhow!("invalid path component {:?}", c)))
                }
            }
            Component::RootDir => {
                if must_be_relative {
                    Some(Err(anyhow::anyhow!("invalid path component {:?}", c)))
                } else {
                    path_str.push('/');
                    None
                }
            }
            _ => Some(Err(anyhow::anyhow!("invalid path component {:?}", c))),
        })
        .collect::<anyhow::Result<Vec<_>>>()?;
    let parts = parts.join("/");
    path_str.push_str(&parts);
    Ok(path_str)
}

async fn show_provide_progress_with_logging(
    mut recv: mpsc::Receiver<iroh_blobs::provider::events::ProviderMessage>,
    app_handle: AppHandle,
    total_file_size: u64,
) -> anyhow::Result<()> {
    use n0_future::FuturesUnordered;
    use std::sync::Arc;
    use tokio::sync::Mutex;
    
    // tracing::info!("🔍 Provider progress handler started with total file size: {} bytes", total_file_size);
    
    let mut tasks = FuturesUnordered::new();
    
    #[derive(Clone)]
    struct TransferState {
        start_time: Instant,
        total_size: u64,
    }
    
    let transfer_states: Arc<Mutex<std::collections::HashMap<(u64, u64), TransferState>>> = 
        Arc::new(Mutex::new(std::collections::HashMap::new()));
    
    loop {
        tokio::select! {
            biased;
            item = recv.recv() => {
                let Some(item) = item else {
                    // tracing::info!("🔍 Provider channel closed, exiting handler");
                    break;
                };

                match item {
                    iroh_blobs::provider::events::ProviderMessage::ClientConnectedNotify(msg) => {
                        let node_id = msg.node_id.map(|id| id.fmt_short().to_string()).unwrap_or_else(|| "?".to_string());
                        // tracing::info!("🔗 Client connected: {} (connection_id: {})", node_id, msg.connection_id);
                    }
                    iroh_blobs::provider::events::ProviderMessage::ConnectionClosed(msg) => {
                        // tracing::info!("❌ Connection closed: connection_id {}", msg.connection_id);
                    }
                    iroh_blobs::provider::events::ProviderMessage::GetRequestReceivedNotify(msg) => {
                        let connection_id = msg.connection_id;
                        let request_id = msg.request_id;
                        // tracing::info!("📥 Get request received: connection_id {}, request_id {}", 
                            connection_id, request_id);
                        
                        let app_handle_task = app_handle.clone();
                        let transfer_states_task = transfer_states.clone();
                        
                        let mut rx = msg.rx;
                        tasks.push(async move {
                            // tracing::info!("🔄 Monitoring request: connection_id {}, request_id {}", connection_id, request_id);
                            
                            let mut transfer_started = false;
                            
                            while let Ok(Some(update)) = rx.recv().await {
                                match update {
                                    iroh_blobs::provider::events::RequestUpdate::Started(m) => {
                                        // tracing::info!("▶️  Request started: conn {} req {} idx {} hash {} size {}", 
                                            connection_id, request_id, m.index, m.hash.fmt_short(), m.size);
                                        if !transfer_started {
                                            transfer_states_task.lock().await.insert(
                                                (connection_id, request_id),
                                                TransferState {
                                                    start_time: Instant::now(),
                                                    total_size: total_file_size,
                                                }
                                            );
                                            emit_event(&app_handle_task, "transfer-started");
                                            transfer_started = true;
                                        }
                                    }
                                    iroh_blobs::provider::events::RequestUpdate::Progress(m) => {
                                        // tracing::info!("📊 Progress: conn {} req {} offset {}", 
                                            connection_id, request_id, m.end_offset);
                                        if !transfer_started {
                                            emit_event(&app_handle_task, "transfer-started");
                                            transfer_started = true;
                                        }
                                        
                                        if let Some(state) = transfer_states_task.lock().await.get(&(connection_id, request_id)) {
                                            let elapsed = state.start_time.elapsed().as_secs_f64();
                                            let speed_bps = if elapsed > 0.0 {
                                                m.end_offset as f64 / elapsed
                                            } else {
                                                0.0
                                            };
                                            
                                            emit_progress_event(
                                                &app_handle_task,
                                                m.end_offset,
                                                state.total_size,
                                                speed_bps
                                            );
                                        }
                                    }
                                    iroh_blobs::provider::events::RequestUpdate::Completed(_m) => {
                                        // tracing::info!("✅ Request completed: conn {} req {}", 
                                            connection_id, request_id);
                                        if transfer_started {
                                            transfer_states_task.lock().await.remove(&(connection_id, request_id));
                                            emit_event(&app_handle_task, "transfer-completed");
                                        }
                                    }
                                    iroh_blobs::provider::events::RequestUpdate::Aborted(_m) => {
                                        // tracing::warn!("⚠️  Request aborted: conn {} req {}", 
                                            connection_id, request_id);
                                        if transfer_started {
                                            transfer_states_task.lock().await.remove(&(connection_id, request_id));
                                            emit_event(&app_handle_task, "transfer-completed");
                                        }
                                    }
                                }
                            }
                            
                            // tracing::info!("🏁 Request monitoring finished: connection_id {}, request_id {}", 
                                connection_id, request_id);
                        });
                    }
                    _ => {
                        // tracing::debug!("📊 Provider event: {:?}", item);
                    }
                }
            }
            Some(_) = tasks.next(), if !tasks.is_empty() => {
            }
        }
    }
    
    while tasks.next().await.is_some() {
        // tracing::info!("⏳ Waiting for remaining request tasks to complete...");
    }
    
    // tracing::info!("🔍 Provider progress handler finished");
    Ok(())
}
