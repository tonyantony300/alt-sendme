use crate::core::types::{ReceiveResult, ReceiveOptions, get_or_create_secret};
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
use tokio::select;
use tracing::trace;
use n0_future::StreamExt;

/// Receive a file or directory using a ticket
pub async fn download(ticket_str: String, options: ReceiveOptions) -> anyhow::Result<ReceiveResult> {
    let ticket = BlobTicket::from_str(&ticket_str)?;
    let addr = ticket.node_addr().clone();
    let secret_key = get_or_create_secret()?;
    
    let mut builder = Endpoint::builder()
        .alpns(vec![])
        .secret_key(secret_key)
        .relay_mode(options.relay_mode.into());

    if ticket.node_addr().relay_url.is_none() && ticket.node_addr().direct_addresses.is_empty() {
        builder = builder.add_discovery(DnsDiscovery::n0_dns());
    }
    if let Some(addr) = options.magic_ipv4_addr {
        builder = builder.bind_addr_v4(addr);
    }
    if let Some(addr) = options.magic_ipv6_addr {
        builder = builder.bind_addr_v6(addr);
    }
    
    let endpoint = builder.bind().await?;
    let dir_name = format!(".sendme-recv-{}", ticket.hash().to_hex());
    let iroh_data_dir = std::env::current_dir()?.join(dir_name);
    let db = FsStore::load(&iroh_data_dir).await?;
    let db2 = db.clone();
    
    trace!("load done!");
    let fut = async move {
        trace!("running");
        let hash_and_format = ticket.hash_and_format();
        trace!("computing local");
        let local = db.remote().local(hash_and_format).await?;
        trace!("local done");
        
        let (stats, total_files, payload_size) = if !local.is_complete() {
            trace!("{} not complete", hash_and_format.hash);
            let connection = endpoint.connect(addr, iroh_blobs::protocol::ALPN).await?;
            let (_hash_seq, sizes) =
                get_hash_seq_and_sizes(&connection, &hash_and_format.hash, 1024 * 1024 * 32, None)
                    .await
                    .map_err(show_get_error)?;
            let _total_size = sizes.iter().copied().sum::<u64>();
            let payload_size = sizes.iter().skip(2).copied().sum::<u64>();
            let total_files = (sizes.len().saturating_sub(1)) as u64;
            
            let _local_size = local.local_bytes();
            let get = db.remote().execute_get(connection, local.missing());
            let mut stats = Stats::default();
            let mut stream = get.stream();
            while let Some(item) = stream.next().await {
                trace!("got item {item:?}");
                match item {
                    GetProgressItem::Progress(_offset) => {
                        // Skip progress updates for library version
                    }
                    GetProgressItem::Done(value) => {
                        stats = value;
                        break;
                    }
                    GetProgressItem::Error(cause) => {
                        anyhow::bail!(show_get_error(cause));
                    }
                }
            }
            (stats, total_files, payload_size)
        } else {
            let total_files = local.children().unwrap() - 1;
            let payload_bytes = 0; // todo local.sizes().skip(2).map(Option::unwrap).sum::<u64>();
            (Stats::default(), total_files, payload_bytes)
        };
        
        let collection = Collection::load(hash_and_format.hash, db.as_ref()).await?;
        
        // Determine output directory
        let output_dir = options.output_dir.unwrap_or_else(|| {
            dirs::download_dir().unwrap_or_else(|| std::env::current_dir().unwrap())
        });
        
        export(&db, collection, &output_dir).await?;
        anyhow::Ok((total_files, payload_size, stats, output_dir))
    };
    
    let (total_files, payload_size, _stats, output_dir) = select! {
        x = fut => match x {
            Ok(x) => x,
            Err(e) => {
                // make sure we shutdown the db before exiting
                db2.shutdown().await?;
                anyhow::bail!("error: {e}");
            }
        },
        _ = tokio::signal::ctrl_c() => {
            db2.shutdown().await?;
            anyhow::bail!("Operation cancelled");
        }
    };
    
    tokio::fs::remove_dir_all(iroh_data_dir).await?;
    
    Ok(ReceiveResult {
        message: format!("Downloaded {} files, {} bytes", total_files, payload_size),
        file_path: output_dir,
    })
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

use std::str::FromStr;
