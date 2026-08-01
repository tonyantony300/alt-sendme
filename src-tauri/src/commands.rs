use crate::features::thumbnail::generate_thumbnail;
use crate::state::{AppStateMutex, ShareHandle};
use engine::{
    build_discovery_mode, download, fetch_metadata, get_relay_status as engine_get_relay_status,
    resolve_relay_mode_with_fallback, start_share_items,
    verify_discovery as engine_verify_discovery, verify_relays as engine_verify_relays,
    AddrInfoOptions, AppHandle, DeviceInfo, Discoverability, EventEmitter, FileMetadata,
    FilePreviewItem, NearbyDevice, NodeService, PairedDevice, PairedDeviceInfo, ReceiveOptions,
    SendOptions,
};
use std::collections::BTreeMap;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, Manager, State};

#[allow(unused_imports)]
pub use engine::{
    build_relay_mode, relay_fallback_policy, DiscoveryConfigArg, RelayConfigArg,
    RelayFallbackPolicy, RelayStatusResponse, VerifyDiscoveryResponse, VerifyRelaysResponse,
};

fn relay_fallback_event_payload(
    stage: &'static str,
    fell_back_to_public: bool,
) -> Option<&'static str> {
    fell_back_to_public.then_some(stage)
}

/// Check which relay the app can reach, with public fallback only when selected.
#[tauri::command]
pub async fn get_relay_status(
    relay: Option<RelayConfigArg>,
) -> Result<RelayStatusResponse, String> {
    engine_get_relay_status(relay).await
}

// Wrapper for Tauri AppHandle that implements EventEmitter
struct TauriEventEmitter {
    app_handle: tauri::AppHandle,
}

impl EventEmitter for TauriEventEmitter {
    fn emit_event(&self, event_name: &str) -> Result<(), String> {
        self.app_handle
            .emit(event_name, ())
            .map_err(|e| e.to_string())
    }

    fn emit_event_with_payload(&self, event_name: &str, payload: &str) -> Result<(), String> {
        self.app_handle
            .emit(event_name, payload)
            .map_err(|e| e.to_string())
    }
}

/// Get file or directory size
#[tauri::command]
pub async fn get_file_size(path: String) -> Result<u64, String> {
    let path = PathBuf::from(path);

    if !path.exists() {
        return Err("Path does not exist".to_string());
    }

    tokio::task::spawn_blocking(move || get_total_size(&path))
        .await
        .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
#[cfg(desktop)]
pub async fn focus_main_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        if window.is_minimized().map_err(|e| e.to_string())? {
            window.unminimize().map_err(|e| e.to_string())?;
        }
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    if let Some(window) = app_handle.webview_windows().values().next() {
        window.show().map_err(|e| e.to_string())?;
        if window.is_minimized().map_err(|e| e.to_string())? {
            window.unminimize().map_err(|e| e.to_string())?;
        }
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    Err("No window available to focus".to_string())
}

#[tauri::command]
pub async fn start_sharing(
    path: String,
    relay: Option<RelayConfigArg>,
    discovery: Option<DiscoveryConfigArg>,
    state: State<'_, AppStateMutex>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    send_items(vec![path], relay, discovery, state, app_handle).await
}

/// New interface to start_sharing multiple items at once
#[tauri::command]
pub async fn send_items(
    paths: Vec<String>,
    relay: Option<RelayConfigArg>,
    discovery: Option<DiscoveryConfigArg>,
    state: State<'_, AppStateMutex>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    // Validate input before doing any work.
    if paths.is_empty() {
        return Err("No paths provided".to_string());
    }

    let path_bufs: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();

    // Reserve slot before expensive setup to avoid concurrent start_sharing races.
    {
        let mut app_state = state.lock().await;
        if app_state.current_share.is_some() || app_state.is_share_starting {
            return Err("Already sharing a file. Please stop current share first.".to_string());
        }
        app_state.is_share_starting = true;
    }

    let start_result = async {
        // Prepare metadata outside the state mutex.
        let metadata = build_send_metadata(&path_bufs).await?;
        tracing::info!(
            first_path_stem = ?path_bufs[0].file_stem(),
            total_size = metadata.size,
            has_thumbnail = metadata.thumbnail.is_some(),
            "share metadata prepared for multiple items"
        );

        // Create send options from relay settings.
        let (relay_mode, fell_back_to_public) = resolve_relay_mode_with_fallback(relay).await?;
        let discovery_mode = build_discovery_mode(discovery)?;
        let options = SendOptions {
            relay_mode,
            discovery_mode,
            ticket_type: AddrInfoOptions::RelayAndAddresses,
            magic_ipv4_addr: None,
            magic_ipv6_addr: None,
        };

        // Wrap the app_handle in our EventEmitter implementation.
        let emitter = Arc::new(TauriEventEmitter {
            app_handle: app_handle.clone(),
        });
        let boxed_handle: AppHandle = Some(emitter);

        // Ephemeral share — relay settings apply per session (all platforms including Android).
        let result = start_share_items(path_bufs.clone(), options, &boxed_handle, Some(metadata))
            .await
            .map_err(|error| {
                // The send path had no failure logging, so sender-side bug reports
                // showed connection setup and then nothing.
                tracing::error!(
                    target: "dashbeam::_events::transfer::send_failed",
                    item_count = path_bufs.len(),
                    %error,
                );
                format!("Failed to start sharing: {}", error)
            })?;
        if let Some(payload) = relay_fallback_event_payload("send", fell_back_to_public) {
            // Surface the selected custom->public fallback once the share has
            // actually started with the resolved relay mode.
            let _ = app_handle.emit("relay-fell-back", payload);
        }
        Ok((result.ticket.clone(), path_bufs, result))
    }
    .await;

    match start_result {
        Ok((ticket, paths, result)) => {
            let mut app_state = state.lock().await;
            app_state.is_share_starting = false;

            if app_state.current_share.is_some() {
                return Err("Already sharing a file. Please stop current share first.".to_string());
            }

            // Keep full send result alive to preserve router/temp_tag lifecycle.
            let primary = paths.first().cloned().unwrap_or_else(|| PathBuf::from("."));
            app_state.current_share = Some(ShareHandle::new(ticket.clone(), primary, result));
            Ok(ticket)
        }
        Err(e) => {
            let mut app_state = state.lock().await;
            app_state.is_share_starting = false;
            Err(e)
        }
    }
}

async fn build_send_metadata(paths: &[PathBuf]) -> Result<FileMetadata, String> {
    if paths.is_empty() {
        return Err("No paths provided".to_string());
    }

    let total_size = {
        let paths_for_size = paths.to_vec();
        tokio::task::spawn_blocking(move || {
            let mut total = 0u64;
            for path in &paths_for_size {
                total = total.saturating_add(get_total_size(path)?);
            }
            Ok::<u64, String>(total)
        })
        .await
        .map_err(|e| format!("Task join error: {}", e))??
    };

    if paths.len() == 1 {
        let path = &paths[0];
        let file_name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned();

        let thumbnail = generate_thumbnail(path).await;
        let mime_type = if path.is_file() {
            Some(
                mime_guess::from_path(path)
                    .first_or_octet_stream()
                    .essence_str()
                    .to_string(),
            )
        } else {
            Some("inode/directory".to_string())
        };

        return Ok(FileMetadata {
            file_name,
            item_count: 1,
            size: total_size,
            thumbnail,
            mime_type,
            items: None,
        });
    }

    // For multiple items
    let first_name = paths[0]
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .into_owned();
    let preview_items = collect_preview_items(paths).await?;
    let thumbnail = preview_items.iter().find_map(|item| item.thumbnail.clone());

    Ok(FileMetadata {
        file_name: first_name,
        item_count: paths.len() as u32,
        size: total_size,
        thumbnail,
        mime_type: Some("application/x-iroh-collection".to_string()),
        items: Some(preview_items),
    })
}

/// Fetch metadata from sender by ticket, without starting file download.
#[tauri::command]
pub async fn fetch_ticket_metadata(
    ticket: String,
    relay: Option<RelayConfigArg>,
    discovery: Option<DiscoveryConfigArg>,
) -> Result<FileMetadata, String> {
    let ticket_len = ticket.len();
    tracing::info!(ticket_len, "fetch_ticket_metadata called");

    let (relay_mode, _) = resolve_relay_mode_with_fallback(relay).await?;
    let discovery_mode = build_discovery_mode(discovery)?;
    let options = ReceiveOptions {
        output_dir: None,
        relay_mode,
        discovery_mode,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };

    match fetch_metadata(ticket, options).await {
        Ok(metadata) => {
            tracing::info!(
                file_name_len = metadata.file_name.len(),
                size = metadata.size,
                has_thumbnail = metadata.thumbnail.is_some(),
                "fetch_ticket_metadata succeeded"
            );
            Ok(metadata)
        }
        Err(e) => Err(format!("Failed to fetch metadata: {}", e)),
    }
}

/// Stop the current sharing session
#[tauri::command]
pub async fn stop_sharing(state: State<'_, AppStateMutex>) -> Result<(), String> {
    let mut app_state = state.lock().await;

    if let Some(mut share) = app_state.current_share.take() {
        if let Err(e) = share.stop().await {
            return Err(e);
        }

        #[cfg(target_os = "android")]
        std::fs::remove_dir_all(&share._path);
    }

    #[cfg(any(desktop, target_os = "android"))]
    if let Some(node) = app_state.node.as_ref() {
        node.stop_pairing_host().await;
    }

    Ok(())
}

/// Receive a file using a ticket
#[tauri::command]
pub async fn receive_file(
    ticket: String,
    output_path: String,
    tree_uri: Option<String>,
    relay: Option<RelayConfigArg>,
    discovery: Option<DiscoveryConfigArg>,
    state: State<'_, AppStateMutex>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    use iroh_blobs::ticket::BlobTicket;
    use std::str::FromStr;

    let output_dir = resolve_receive_output_dir(&app_handle, output_path)?;
    let (relay_mode, fell_back_to_public) = resolve_relay_mode_with_fallback(relay).await?;
    let discovery_mode = build_discovery_mode(discovery)?;
    let options = ReceiveOptions {
        output_dir: Some(output_dir.clone()),
        relay_mode,
        discovery_mode,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };

    // Derive the content hash so we can manage partial store lifecycle.
    let incoming_hash = BlobTicket::from_str(&ticket)
        .ok()
        .map(|t| t.hash().to_hex().to_string());

    // If a previous cancel left a partial store for a *different* hash, delete it now.
    // Same hash → keep it for resume. Different hash → it would never be reused.
    // Only act when we know the new hash; if the ticket is unparseable, leave the
    // stale entry intact so the next valid attempt can still clean it up.
    if let Some(ref new_hash) = incoming_hash {
        let stale_hash = state.lock().await.last_cancelled_recv_hash.take();
        if let Some(stale_hash) = stale_hash {
            if &stale_hash != new_hash {
                let stale_dir = std::env::temp_dir().join(format!(".sendme-recv-{}", stale_hash));
                if stale_dir.exists() {
                    if let Err(e) = tokio::fs::remove_dir_all(&stale_dir).await {
                        tracing::warn!("Failed to remove stale partial recv store: {}", e);
                    } else {
                        tracing::info!("Removed stale partial recv store for hash {}", stale_hash);
                    }
                }
            }
        }
    }

    let emitter = Arc::new(TauriEventEmitter {
        app_handle: app_handle.clone(),
    });
    let boxed_handle: AppHandle = Some(emitter);

    if let Some(payload) = relay_fallback_event_payload("receive", fell_back_to_public) {
        let _ = app_handle.emit("relay-fell-back", payload);
    }

    // Create a cancel channel and store the sender so cancel_receive can fire it.
    let (cancel_tx, cancel_rx) = tokio::sync::oneshot::channel::<()>();
    {
        let mut app_state = state.lock().await;
        if app_state.current_receive_cancel.is_some() {
            return Err(
                "Already receiving a file. Wait for the current download to finish.".to_string(),
            );
        }
        app_state.current_receive_cancel = Some(cancel_tx);
    }

    let result = download(ticket, options, boxed_handle, cancel_rx).await;

    // Update state based on outcome.
    {
        let mut app_state = state.lock().await;
        app_state.current_receive_cancel = None;
        match &result {
            Err(e) if e.to_string() == "cancelled" => {
                // Record the hash so the next receive can decide whether to delete this partial.
                app_state.last_cancelled_recv_hash = incoming_hash;
            }
            Ok(_) | Err(_) => {
                // Success deletes the store automatically (armed guard).
                // Network errors keep the partial for same-session retry — treated the
                // same as cancel from the user's perspective re: cleanup.
                if result.is_err() {
                    app_state.last_cancelled_recv_hash = incoming_hash;
                }
            }
        }
    }

    match result {
        Ok(r) => {
            #[cfg(target_os = "android")]
            {
                finalize_android_receive(&app_handle, &output_dir, tree_uri.as_deref())?;
            }
            #[cfg(not(target_os = "android"))]
            {
                let _ = tree_uri;
            }
            Ok(r.message)
        }
        Err(e) if e.to_string() == "cancelled" => {
            // User-initiated cancellation — not an error from the UI's perspective.
            Err("cancelled".to_string())
        }
        Err(e) => {
            tracing::error!("Failed to receive file: {}", e);
            Err(format!("Failed to receive file: {}", e))
        }
    }
}

#[cfg(target_os = "android")]
fn finalize_android_receive(
    app_handle: &tauri::AppHandle,
    staging_dir: &Path,
    tree_uri: Option<&str>,
) -> Result<(), String> {
    use tauri_plugin_native_utils::{ExportToTreeArgs, NativeUtilsExt};

    let tree_uri = tree_uri.map(str::trim).filter(|uri| !uri.is_empty());

    let Some(tree_uri) = tree_uri else {
        emit_receive_download_fallback(app_handle, staging_dir, "private");
        return Ok(());
    };

    let export_result = app_handle.native_utils().export_to_tree(ExportToTreeArgs {
        tree_uri: tree_uri.to_string(),
        source_dir: staging_dir.to_string_lossy().into_owned(),
    });

    match export_result {
        Ok(result) => {
            tracing::info!(
                exported = result.exported_count,
                conflicts = result.conflicts.len(),
                "Exported received files to SAF tree"
            );
            if let Err(e) = std::fs::remove_dir_all(staging_dir) {
                tracing::warn!(
                    "Failed to clean staging dir after SAF export ({}): {}",
                    staging_dir.display(),
                    e
                );
            }
            Ok(())
        }
        Err(e) => {
            tracing::warn!("SAF export failed, keeping app-private files: {e}");
            emit_receive_download_fallback(app_handle, staging_dir, "saf");
            // Transfer itself succeeded — files remain in staging.
            Ok(())
        }
    }
}

#[cfg(target_os = "android")]
fn emit_receive_download_fallback(app_handle: &tauri::AppHandle, staging_dir: &Path, reason: &str) {
    let payload = serde_json::json!({
        "path": staging_dir.to_string_lossy(),
        "reason": reason,
    });
    let _ = app_handle.emit("receive-download-fallback", payload);
}

fn resolve_receive_output_dir(
    app_handle: &tauri::AppHandle,
    output_path: String,
) -> Result<PathBuf, String> {
    #[cfg(target_os = "android")]
    {
        let _ = output_path;
        return android_staging_receive_dir(app_handle);
    }

    #[cfg(not(target_os = "android"))]
    {
        let output_dir = PathBuf::from(output_path.trim());
        if output_dir.as_os_str().is_empty() {
            return fallback_receive_dir(app_handle);
        }

        match ensure_dir_writable(&output_dir) {
            Ok(()) => Ok(output_dir),
            Err(error) => {
                tracing::warn!(
                    "Receive output dir not writable ({}): {}",
                    output_dir.display(),
                    error
                );
                Err("Selected download folder is not writable".to_string())
            }
        }
    }
}

#[cfg(target_os = "android")]
fn android_staging_receive_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let transfer_id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let staging = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))?
        .join("downloads")
        .join(format!("recv-{transfer_id}"));
    ensure_dir_writable(&staging)
        .map_err(|e| format!("Failed to prepare staging download dir: {e}"))?;
    Ok(staging)
}

#[cfg(not(target_os = "android"))]
fn fallback_receive_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let fallback = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {e}"))?
        .join("downloads");
    ensure_dir_writable(&fallback)
        .map_err(|e| format!("Failed to prepare fallback download dir: {e}"))?;
    Ok(fallback)
}

fn ensure_dir_writable(dir: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dir)?;
    let probe_name = format!(
        ".sendme_write_test_{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos()
    );
    let probe_path = dir.join(probe_name);
    std::fs::write(&probe_path, b"probe")?;
    std::fs::remove_file(probe_path)?;
    Ok(())
}

/// Cancel the currently active receive, if any.
/// Partial data is preserved on disk so the transfer can be resumed.
#[tauri::command]
pub async fn cancel_receive(state: State<'_, AppStateMutex>) -> Result<(), String> {
    let mut app_state = state.lock().await;
    if let Some(tx) = app_state.current_receive_cancel.take() {
        // Sending () signals the download future to stop. If the receiver is
        // already gone (download finished first) this is a harmless no-op.
        let _ = tx.send(());
    }
    Ok(())
}

/// Get the current sharing status
#[tauri::command]
pub async fn get_sharing_status(state: State<'_, AppStateMutex>) -> Result<Option<String>, String> {
    let app_state = state.lock().await;
    Ok(app_state
        .current_share
        .as_ref()
        .map(|share| share.ticket.clone()))
}

/// Check if a path is a file or directory
#[tauri::command]
pub async fn check_path_type(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);

    if !path.exists() {
        return Err("Path does not exist".to_string());
    }

    if path.is_dir() {
        Ok("directory".to_string())
    } else if path.is_file() {
        Ok("file".to_string())
    } else {
        Err("Path is neither a file nor a directory".to_string())
    }
}

#[tauri::command]
pub async fn get_paths_mime_types(paths: Vec<String>) -> Result<Vec<Option<String>>, String> {
    let result = paths
        .into_iter()
        .map(|path| {
            let path_buf = PathBuf::from(path);
            if path_buf.is_dir() {
                return Some("inode/directory".to_string());
            }
            if path_buf.is_file() {
                return Some(
                    mime_guess::from_path(path_buf)
                        .first_or_octet_stream()
                        .essence_str()
                        .to_string(),
                );
            }
            None
        })
        .collect();

    Ok(result)
}

/// Get the current transport status (whether bytes are actively being transferred)
#[tauri::command]
pub async fn get_transport_status(state: State<'_, AppStateMutex>) -> Result<bool, String> {
    let app_state = state.lock().await;
    Ok(app_state.is_transporting)
}

/// Check if there was a launch intent (file path passed via CLI)
/// Returns the path if present and clears it from state
#[tauri::command]
pub async fn check_launch_intent(
    state: State<'_, AppStateMutex>,
) -> Result<Option<String>, String> {
    let mut app_state = state.lock().await;
    Ok(app_state.launch_intent.take())
}

#[tauri::command]
pub async fn toggle_context_menu(
    enable: bool,
    #[allow(unused_variables)] allow_elevation: Option<bool>,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        if enable {
            crate::platform::windows::context_menu::register_context_menu()
                .map_err(|e| e.to_string())
        } else {
            crate::platform::windows::context_menu::unregister_context_menu(
                allow_elevation.unwrap_or(true),
            )
            .map_err(|e| e.to_string())
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = enable;
        Ok(())
    }
}

/// True when running the Windows no-install ZIP layout (`.portable` marker).
#[tauri::command]
pub fn is_windows_portable() -> bool {
    crate::platform::windows::portable::is_portable()
}

/// State of the debug-logging toggle.
///
/// `enabled` is the persisted marker; `active_this_session` is whether the file sink was
/// actually installed at launch. They disagree between toggling and restarting, which is
/// what the UI's "restart required" hint keys off.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DebugLoggingState {
    pub enabled: bool,
    pub active_this_session: bool,
    pub log_dir: Option<String>,
}

fn app_config_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map_err(|e| format!("Failed to resolve config dir: {e}"))
}

fn app_log_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_log_dir()
        .map_err(|e| format!("Failed to resolve log dir: {e}"))
}

#[tauri::command]
pub fn get_debug_logging(app: tauri::AppHandle) -> Result<DebugLoggingState, String> {
    let config_dir = app_config_dir(&app)?;
    Ok(DebugLoggingState {
        enabled: crate::logging::is_enabled(&config_dir),
        active_this_session: crate::logging::is_active(),
        log_dir: app_log_dir(&app)
            .ok()
            .map(|p| p.to_string_lossy().into_owned()),
    })
}

/// Takes effect on the next launch — the subscriber is never reconfigured while running.
///
/// Turning it off also purges immediately rather than waiting for a relaunch, so
/// "off" means the logs are gone even if the app is never reopened.
#[tauri::command]
pub fn set_debug_logging(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    let config_dir = app_config_dir(&app)?;
    crate::logging::set_enabled(&config_dir, enabled)
        .map_err(|e| format!("Failed to update debug logging: {e}"))?;

    if !enabled {
        if let Ok(log_dir) = app_log_dir(&app) {
            // Best-effort: the file for the current session may still be open on
            // Windows, and startup pruning finishes the job either way.
            let _ = crate::logging::clear(&log_dir);
        }
    }

    Ok(())
}

#[tauri::command]
pub fn clear_debug_logs(app: tauri::AppHandle) -> Result<(), String> {
    let log_dir = app_log_dir(&app)?;
    crate::logging::clear(&log_dir).map_err(|e| format!("Failed to clear logs: {e}"))
}

/// Largest bundle we will write. Comfortably under GitHub's attachment limit.
const MAX_BUNDLE_BYTES: usize = 5 * 1024 * 1024;

/// Write a metadata header plus captured logs to `dest_path`.
///
/// Everything is assembled here rather than in the frontend so the file is complete even
/// if the UI is partly broken.
#[tauri::command]
pub async fn export_debug_bundle(
    app: tauri::AppHandle,
    dest_path: String,
    relay: Option<RelayConfigArg>,
    #[allow(unused_variables)] state: State<'_, AppStateMutex>,
) -> Result<(), String> {
    let log_dir = app_log_dir(&app)?;

    let mut out = String::new();
    out.push_str("DashBeam diagnostics\n");
    out.push_str("====================\n\n");
    out.push_str(&format!(
        "App version: {}\n",
        crate::version::get_app_version()
    ));
    // `std::env::consts::OS` alone gives "macos" with no version, which is not enough
    // to triage platform-specific bugs.
    out.push_str(&format!(
        "OS: {} {} ({})\n",
        tauri_plugin_os::platform(),
        tauri_plugin_os::version(),
        std::env::consts::ARCH
    ));
    out.push_str(&format!(
        "Debug logging active this session: {}\n",
        crate::logging::is_active()
    ));

    // Relay configuration is the first question for any connectivity report, and the
    // frontend is the only place that knows what the user selected.
    match relay.as_ref() {
        Some(config) => {
            out.push_str(&format!("Relay mode: {}\n", config.mode));
            if !config.urls.iter().all(|u| u.trim().is_empty()) {
                out.push_str(&format!("Relay URLs: {}\n", config.urls.join(", ")));
            }
            if let Some(fallback) = config.fallback.as_ref() {
                out.push_str(&format!("Relay fallback: {fallback}\n"));
            }
            out.push_str(&format!(
                "Relay auth token configured: {}\n",
                config.auth_token.as_ref().is_some_and(|t| !t.is_empty())
            ));
        }
        None => out.push_str("Relay mode: unknown (not reported by the UI)\n"),
    }

    match engine_get_relay_status(relay).await {
        Ok(status) => out.push_str(&format!(
            "Relay reachable: {} (kind={}, url={}, fell_back_to_public={})\n",
            status.connected,
            status.kind,
            status.url.unwrap_or_else(|| "-".to_string()),
            status.fell_back_to_public
        )),
        Err(error) => out.push_str(&format!("Relay status check failed: {error}\n")),
    }

    for (label, key) in [
        ("Session type", "XDG_SESSION_TYPE"),
        ("Wayland display", "WAYLAND_DISPLAY"),
        ("AppImage", "APPIMAGE"),
        ("Flatpak", "FLATPAK_ID"),
    ] {
        if let Ok(value) = std::env::var(key) {
            out.push_str(&format!("{label}: {value}\n"));
        }
    }

    #[cfg(any(desktop, target_os = "android"))]
    {
        let guard = state.lock().await;
        match guard.node.as_ref() {
            Some(node) => {
                let info = node.device_info();
                out.push_str(&format!("Device name: {}\n", info.display_name));
                out.push_str(&format!("Device type: {}\n", info.device_type));
                out.push_str(&format!("Device OS: {}\n", info.os));
                out.push_str(&format!("Endpoint ID: {}\n", info.endpoint_id));
            }
            None => {
                out.push_str("Device node: unavailable\n");
                if let Some(error) = guard.node_init_error.as_ref() {
                    out.push_str(&format!("Device node error: {error}\n"));
                }
            }
        }
    }

    out.push_str("\n--- logs ---\n\n");
    let remaining = MAX_BUNDLE_BYTES.saturating_sub(out.len());
    match crate::logging::read_logs(&log_dir, remaining) {
        Ok(logs) if logs.is_empty() => {
            out.push_str("(no logs captured — enable debug mode and restart)\n");
        }
        Ok(logs) => out.push_str(&logs),
        Err(error) => out.push_str(&format!("(failed to read logs: {error})\n")),
    }

    std::fs::write(&dest_path, out).map_err(|e| format!("Failed to write {dest_path}: {e}"))
}

/// Helper function to calculate total size of a file or directory
fn get_total_size(path: &Path) -> Result<u64, String> {
    if path.is_file() {
        return std::fs::metadata(path)
            .map(|m| m.len())
            .map_err(|e| format!("Failed to read metadata for {}: {e}", path.display()));
    }

    if path.is_dir() {
        let mut total_size = 0u64;
        for entry in walkdir::WalkDir::new(path) {
            let entry = entry.map_err(|e| format!("Failed to traverse {}: {e}", path.display()))?;
            if entry.file_type().is_file() {
                let metadata = entry.metadata().map_err(|e| {
                    format!(
                        "Failed to read metadata for {}: {e}",
                        entry.path().display()
                    )
                })?;
                total_size = total_size.saturating_add(metadata.len());
            }
        }
        return Ok(total_size);
    }

    Err(format!(
        "Path is neither a file nor a directory: {}",
        path.display()
    ))
}

fn dedup_name(name: &str, seen: &mut BTreeMap<String, usize>) -> String {
    match seen.get_mut(name) {
        Some(count) => {
            *count += 1;
            format!("{} ({})", name, count)
        }
        None => {
            seen.insert(name.to_string(), 1);
            name.to_string()
        }
    }
}

async fn collect_preview_items(paths: &[PathBuf]) -> Result<Vec<FilePreviewItem>, String> {
    let mut items = Vec::with_capacity(paths.len());
    let mut seen_names = BTreeMap::new();

    for path in paths {
        let file_name = path
            .file_name()
            .and_then(|name| name.to_str())
            .filter(|name| !name.is_empty())
            .unwrap_or("item")
            .to_string();
        let final_name = dedup_name(&file_name, &mut seen_names);
        let size = get_total_size(path)?;
        let mime_type = if path.is_dir() {
            Some("inode/directory".to_string())
        } else {
            Some(
                mime_guess::from_path(path)
                    .first_or_octet_stream()
                    .essence_str()
                    .to_string(),
            )
        };
        let thumbnail = if path.is_file() {
            generate_thumbnail(path).await
        } else {
            None
        };
        items.push(FilePreviewItem {
            file_name: final_name,
            size,
            thumbnail,
            mime_type,
        });
    }

    items.sort_by(|a, b| a.file_name.cmp(&b.file_name));

    Ok(items)
}

/// Verify connectivity to configured relay servers.
#[tauri::command]
pub async fn verify_relays(relay: RelayConfigArg) -> Result<VerifyRelaysResponse, String> {
    engine_verify_relays(relay).await
}

/// Verify reachability of a custom self-hosted discovery (pkarr) server.
#[tauri::command]
pub async fn verify_discovery(
    discovery: DiscoveryConfigArg,
) -> Result<VerifyDiscoveryResponse, String> {
    engine_verify_discovery(discovery).await
}

/// Extracts the persisted `discoverability` value from the raw contents of
/// tauri-plugin-store's `settings.json` — the same file the frontend's
/// `useAppSettingStore` writes (a zustand `persist` envelope, JSON-stringified
/// under the `app_settings` key). `None` when the file, key, or field is
/// missing or malformed; callers fall back to the default.
#[cfg(any(desktop, target_os = "android", test))]
fn parse_persisted_discoverability(raw: &str) -> Option<Discoverability> {
    let file: serde_json::Value = serde_json::from_str(raw).ok()?;
    let envelope: serde_json::Value =
        serde_json::from_str(file.get("app_settings")?.as_str()?).ok()?;
    serde_json::from_value(envelope.get("state")?.get("discoverability")?.clone()).ok()
}

/// Reads the user's persisted discoverability choice so it reaches
/// `NodeService::start` *before* LAN discovery starts — an `Off`-persisted
/// start must never register mDNS at all, not even for the moment it takes
/// the webview to load and sync settings (`DeviceNodeSync` re-applies it
/// then, as a safety net, the same way relay settings are re-applied).
///
/// A deliberate raw read of the store file rather than `StoreExt::store`:
/// loading the store Rust-side would register it without the frontend's
/// `LazyStore` options (defaults, autoSave), and the plugin silently reuses
/// the first-registered instance.
#[cfg(any(desktop, target_os = "android"))]
fn load_persisted_discoverability(app_handle: &tauri::AppHandle) -> Discoverability {
    let Ok(data_dir) = app_handle.path().app_data_dir() else {
        return Discoverability::default();
    };
    let Ok(raw) = std::fs::read_to_string(data_dir.join("settings.json")) else {
        return Discoverability::default();
    };
    parse_persisted_discoverability(&raw).unwrap_or_default()
}

/// Extracts the persisted `minimizeToTray` value from the raw contents of
/// tauri-plugin-store's `settings.json`. Same envelope shape as
/// `parse_persisted_discoverability` — see its doc comment for why this is a
/// raw file read rather than `StoreExt::store`.
#[cfg(any(desktop, test))]
fn parse_persisted_minimize_to_tray(raw: &str) -> Option<bool> {
    let file: serde_json::Value = serde_json::from_str(raw).ok()?;
    let envelope: serde_json::Value =
        serde_json::from_str(file.get("app_settings")?.as_str()?).ok()?;
    envelope.get("state")?.get("minimizeToTray")?.as_bool()
}

/// The user's "keep running in the background" choice, read before the first
/// window-close can happen. Defaults to `true`: closing to the tray is the
/// behaviour every existing install already has (the old close handler hid
/// unconditionally), so a missing key must not silently start quitting.
#[cfg(desktop)]
pub fn load_persisted_minimize_to_tray(app_handle: &tauri::AppHandle) -> bool {
    let Ok(data_dir) = app_handle.path().app_data_dir() else {
        return true;
    };
    let Ok(raw) = std::fs::read_to_string(data_dir.join("settings.json")) else {
        return true;
    };
    parse_persisted_minimize_to_tray(&raw).unwrap_or(true)
}

#[cfg(any(desktop, target_os = "android"))]
pub async fn init_node_service(app_handle: tauri::AppHandle) -> Result<(), String> {
    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let (relay_mode, _) = resolve_relay_mode_with_fallback(None).await?;
    let relay_mode: iroh::endpoint::RelayMode = relay_mode.into();
    let discovery_mode = build_discovery_mode(None)?;
    let discoverability = load_persisted_discoverability(&app_handle);

    let emitter = Arc::new(TauriEventEmitter {
        app_handle: app_handle.clone(),
    });
    let boxed_handle: AppHandle = Some(emitter);
    let node = NodeService::start(
        &data_dir,
        relay_mode,
        discovery_mode,
        discoverability,
        boxed_handle,
    )
    .await
    .map_err(|e| format!("Failed to start device node: {e}"))?;
    let state = app_handle.state::<AppStateMutex>();
    let mut guard = state.lock().await;
    guard.node = Some(Arc::new(node));
    guard.node_init_error = None;

    Ok(())
}

#[derive(serde::Serialize)]
pub struct NodeStatusResponse {
    pub status: String,
    pub reason: Option<String>,
    /// When status is ready: whether the home relay / network path is warmed up.
    #[serde(default)]
    pub network_ready: bool,
}

#[cfg(any(desktop, target_os = "android"))]
fn node_status_from_state(guard: &crate::state::AppState) -> NodeStatusResponse {
    if let Some(node) = &guard.node {
        return NodeStatusResponse {
            status: "ready".to_string(),
            reason: None,
            network_ready: node.is_network_ready(),
        };
    }
    // Init still in flight: distinguish from a hard failure so the UI keeps waiting.
    if guard.node_init_error.is_none() {
        return NodeStatusResponse {
            status: "starting".to_string(),
            reason: None,
            network_ready: false,
        };
    }
    NodeStatusResponse {
        status: "unavailable".to_string(),
        reason: guard.node_init_error.clone(),
        network_ready: false,
    }
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn get_node_status(
    state: State<'_, AppStateMutex>,
) -> Result<NodeStatusResponse, String> {
    let guard = state.lock().await;
    let status = node_status_from_state(&guard);

    Ok(status)
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn reconfigure_node_relay(
    relay: Option<RelayConfigArg>,
    discovery: Option<DiscoveryConfigArg>,
    state: State<'_, AppStateMutex>,
) -> Result<(), String> {
    // Captured before `relay` is consumed, so the log can say what was asked for.
    let relay_mode_label = relay
        .as_ref()
        .map(|r| r.mode.clone())
        .unwrap_or_else(|| "default".to_string());
    let relay_urls_label = relay
        .as_ref()
        .map(|r| r.urls.join(", "))
        .unwrap_or_default();

    let (relay_mode, _) = resolve_relay_mode_with_fallback(relay).await?;
    let relay_mode: iroh::endpoint::RelayMode = relay_mode.into();
    let discovery_mode = build_discovery_mode(discovery)?;

    let node = {
        let guard = state.lock().await;
        if guard.current_share.is_some() || guard.is_share_starting {
            return Err(
                "Stop sharing before changing network settings for paired devices.".to_string(),
            );
        }
        guard
            .node
            .clone()
            .ok_or_else(|| "Device pairing is not available on this device.".to_string())?
    };

    // Without this the log shows the endpoint suddenly re-homing with no explanation.
    tracing::debug!(
        target: "dashbeam::_events::relay::reconfigure",
        mode = %relay_mode_label,
        urls = %relay_urls_label,
        "relay/discovery settings changed"
    );

    node.reconfigure_network(relay_mode, discovery_mode)
        .await
        .map_err(|error| {
            tracing::error!(
                target: "dashbeam::_events::relay::reconfigure_failed",
                mode = %relay_mode_label,
                %error,
            );
            format!("Failed to update device network settings: {error}")
        })?;

    Ok(())
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn get_device_info(state: State<'_, AppStateMutex>) -> Result<DeviceInfo, String> {
    let guard = state.lock().await;
    let node = guard.node.as_ref().ok_or_else(|| {
        guard
            .node_init_error
            .clone()
            .unwrap_or_else(|| "Device pairing is not available.".to_string())
    })?;
    let info = node.device_info();

    Ok(info)
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn set_device_display_name(
    display_name: String,
    state: State<'_, AppStateMutex>,
) -> Result<DeviceInfo, String> {
    let guard = state.lock().await;
    let node = require_node(&guard)?;
    let info = node
        .set_device_display_name(&display_name)
        .map_err(|e| e.to_string())?;

    Ok(info)
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn rename_paired_device(
    endpoint_id: String,
    display_name: String,
    state: State<'_, AppStateMutex>,
) -> Result<PairedDevice, String> {
    let guard = state.lock().await;
    let node = require_node(&guard)?;
    let device = node
        .rename_paired(&endpoint_id, &display_name)
        .map_err(|e| e.to_string())?;

    Ok(device)
}

#[cfg(any(desktop, target_os = "android"))]
fn require_node(guard: &crate::state::AppState) -> Result<&NodeService, String> {
    guard.node.as_deref().ok_or_else(|| {
        guard
            .node_init_error
            .clone()
            .unwrap_or_else(|| "Device pairing is not available.".to_string())
    })
}

#[cfg(any(desktop, target_os = "android"))]
fn require_node_arc(guard: &crate::state::AppState) -> Result<Arc<NodeService>, String> {
    guard.node.clone().ok_or_else(|| {
        guard
            .node_init_error
            .clone()
            .unwrap_or_else(|| "Device pairing is not available.".to_string())
    })
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn get_pairing_ticket(state: State<'_, AppStateMutex>) -> Result<String, String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    node.pairing_ticket().map_err(|e| e.to_string())
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn start_pairing_host(
    ttl_secs: Option<u64>,
    state: State<'_, AppStateMutex>,
) -> Result<String, String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    let ticket = node
        .start_pairing_host(ttl_secs)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ticket)
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn stop_pairing_host(state: State<'_, AppStateMutex>) -> Result<(), String> {
    let node = {
        let guard = state.lock().await;
        guard.node.clone()
    };
    if let Some(node) = node {
        node.stop_pairing_host().await;
    }

    Ok(())
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn join_pairing(ticket: String, state: State<'_, AppStateMutex>) -> Result<(), String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    node.join_pairing(&ticket)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn list_paired_devices(
    state: State<'_, AppStateMutex>,
) -> Result<Vec<PairedDeviceInfo>, String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    let devices = node.list_paired().map_err(|e| e.to_string())?;

    Ok(devices)
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn forget_paired_device(
    endpoint_id: String,
    state: State<'_, AppStateMutex>,
) -> Result<(), String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    node.forget_paired(&endpoint_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(serde::Serialize)]
pub struct InviteDelivered {
    pub delivered: bool,
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn invite_paired_device(
    endpoint_id: String,
    blob_ticket: String,
    file_count: u32,
    total_size: u64,
    state: State<'_, AppStateMutex>,
) -> Result<InviteDelivered, String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    let delivered = node
        .invite_paired_device(&endpoint_id, &blob_ticket, file_count, total_size)
        .await
        .map_err(|e| e.to_string())?;

    Ok(InviteDelivered { delivered })
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn respond_paired_invite(
    endpoint_id: String,
    accepted: bool,
    state: State<'_, AppStateMutex>,
) -> Result<(), String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    node.respond_paired_invite(&endpoint_id, accepted)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn list_nearby(state: State<'_, AppStateMutex>) -> Result<Vec<NearbyDevice>, String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    Ok(node.list_nearby().await)
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn get_discoverability(
    state: State<'_, AppStateMutex>,
) -> Result<Discoverability, String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    Ok(node.discoverability().await)
}

/// The frontend seam is `setDiscoverability` in
/// `frontend/src/lib/pairing-api.ts` — its invoke payload key must match this
/// command's `setting` parameter name.
#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn set_discoverability(
    setting: Discoverability,
    state: State<'_, AppStateMutex>,
) -> Result<(), String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    node.set_discoverability(setting).await.map_err(|error| {
        tracing::error!(
            target: "dashbeam::_events::nearby::set_discoverability_failed",
            ?setting,
            %error,
        );
        format!("Failed to update discoverability: {error}")
    })?;

    Ok(())
}

#[derive(serde::Serialize)]
pub struct NearbyStatusResponse {
    /// Why LAN discovery is unavailable (mDNS pump failed to start), or
    /// `None` when it's running or deliberately off. Queryable because the
    /// `nearby-unavailable` event can fire during node init, before the
    /// frontend has any listener registered.
    pub reason: Option<String>,
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn nearby_status(
    state: State<'_, AppStateMutex>,
) -> Result<NearbyStatusResponse, String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    Ok(NearbyStatusResponse {
        reason: node.nearby_unavailable_reason(),
    })
}

/// Delivers the caller's active share ticket to a Nearby device over the
/// control ALPN — same path as `invite_paired_device`. The receiver's
/// fingerprint confirmation is what promotes the peer to paired.
#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn invite_nearby_device(
    endpoint_id: String,
    blob_ticket: String,
    file_count: u32,
    total_size: u64,
    state: State<'_, AppStateMutex>,
) -> Result<InviteDelivered, String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    let delivered = node
        .invite_nearby_device(&endpoint_id, &blob_ticket, file_count, total_size)
        .await
        .map_err(|e| e.to_string())?;

    Ok(InviteDelivered { delivered })
}

/// Asks a Nearby device to pair (no file share). Receiver confirms on name /
/// device type; accept reuses `respond_nearby_invite`.
#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn request_nearby_pair(
    endpoint_id: String,
    state: State<'_, AppStateMutex>,
) -> Result<InviteDelivered, String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    let delivered = node
        .request_nearby_pair(&endpoint_id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(InviteDelivered { delivered })
}

#[cfg(any(desktop, target_os = "android"))]
#[tauri::command]
pub async fn respond_nearby_invite(
    endpoint_id: String,
    accept: bool,
    block: bool,
    state: State<'_, AppStateMutex>,
) -> Result<(), String> {
    let node = {
        let guard = state.lock().await;
        require_node_arc(&guard)?
    };
    let result = if accept {
        node.accept_nearby_invite(&endpoint_id).await
    } else {
        node.decline_nearby_invite(&endpoint_id, block).await
    };
    result.map_err(|e| e.to_string())
}

/// Show a desktop notification that stays as long as the OS allows.
///
/// The Tauri notification plugin always uses the default timeout (often a
/// couple of seconds) and does not expose a timeout API. Invite toasts need
/// to be readable/actionable, so desktop goes through notify-rust with
/// `Timeout::Never` (Linux: until dismissed; Windows: longest toast; macOS
/// ignores timeout — banner length is system-controlled).
#[cfg(desktop)]
#[tauri::command]
pub fn show_system_notification(
    app: tauri::AppHandle,
    title: String,
    body: Option<String>,
    icon: Option<String>,
) -> Result<(), String> {
    let mut notification = notify_rust::Notification::new();
    let app_name = app
        .config()
        .product_name
        .clone()
        .unwrap_or_else(|| "DashBeam".into());
    notification.appname(&app_name);
    notification.summary(&title);
    if let Some(body) = body.as_deref() {
        notification.body(body);
    }
    if let Some(icon) = icon.as_deref() {
        notification.icon(icon);
    } else {
        notification.auto_icon();
    }
    notification.timeout(notify_rust::Timeout::Never);

    #[cfg(windows)]
    {
        let exe = tauri::utils::platform::current_exe().map_err(|e| e.to_string())?;
        let exe_dir = exe
            .parent()
            .ok_or_else(|| "failed to get exe directory".to_string())?;
        let curr_dir = exe_dir.display().to_string();
        let sep = std::path::MAIN_SEPARATOR;
        // AppUserModelID only when installed — matching tauri-plugin-notification.
        if !(curr_dir.ends_with(&format!("{sep}target{sep}debug"))
            || curr_dir.ends_with(&format!("{sep}target{sep}release")))
        {
            notification.app_id(&app.config().identifier);
        }
    }

    #[cfg(target_os = "macos")]
    {
        let identifier = app.config().identifier.clone();
        let _ = notify_rust::set_application(if tauri::is_dev() {
            "com.apple.Terminal"
        } else {
            &identifier
        });
    }

    notification.show().map_err(|e| e.to_string())?;
    Ok(())
}

/// Mirror the frontend's "keep running in the background" switch into the
/// process-wide flag the window-close handler reads.
#[cfg(desktop)]
#[tauri::command]
pub fn set_background_on_close(enabled: bool) {
    crate::tray::set_background_on_close(enabled);
}

/// Push translated tray strings from the frontend. Best-effort: a missing
/// tray (build failed, or not yet created) is a no-op.
#[cfg(desktop)]
#[tauri::command]
pub fn set_tray_labels(app_handle: tauri::AppHandle, labels: crate::tray::TrayLabels) {
    crate::tray::apply_labels(&app_handle, labels);
}

/// Whether the OS currently launches DashBeam at sign-in. The OS is the
/// source of truth — a user who removed the login item outside the app must
/// see the toggle turn itself off.
/// `null` means the platform cannot be asked (Flatpak) — the caller keeps
/// its cached value rather than prompting the user.
#[cfg(desktop)]
#[tauri::command]
pub fn autostart_is_enabled(app_handle: tauri::AppHandle) -> Result<Option<bool>, String> {
    crate::autostart::is_enabled(&app_handle)
}

/// Request an autostart change. Returns the state the OS ended up in, which
/// may differ from `enabled` when the platform (or the user, via a portal
/// dialog) refuses.
///
/// `async` on purpose: Tauri runs synchronous commands on the main thread, and
/// the Flatpak path blocks on a portal consent dialog until the user answers
/// it. As an async command Tauri drives this off the main thread, so the
/// window keeps painting while the dialog is up.
#[cfg(desktop)]
#[tauri::command]
pub async fn autostart_set(app_handle: tauri::AppHandle, enabled: bool) -> Result<bool, String> {
    crate::autostart::set(&app_handle, enabled).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use engine::{start_share, RelayModeOption};
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_temp_file(name_prefix: &str) -> PathBuf {
        let ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock should be after unix epoch")
            .as_nanos();
        std::env::temp_dir().join(format!("{}-{}-{}.txt", name_prefix, std::process::id(), ts))
    }

    /// Locks the persisted-settings seam: the raw `settings.json` layout this
    /// parses is written by the frontend's `useAppSettingStore` (zustand
    /// `persist` envelope, stringified under `app_settings`).
    #[test]
    fn parse_persisted_discoverability_reads_the_zustand_envelope() {
        let envelope = serde_json::json!({ "state": { "discoverability": "off", "darkMode": true }, "version": 0 });
        let file = serde_json::json!({ "app_settings": envelope.to_string() }).to_string();
        assert_eq!(
            parse_persisted_discoverability(&file),
            Some(Discoverability::Off)
        );

        let envelope = serde_json::json!({ "state": { "discoverability": "paired-only" } });
        let file = serde_json::json!({ "app_settings": envelope.to_string() }).to_string();
        assert_eq!(
            parse_persisted_discoverability(&file),
            Some(Discoverability::PairedOnly)
        );
    }

    #[test]
    fn parse_persisted_discoverability_tolerates_missing_or_malformed_data() {
        assert_eq!(parse_persisted_discoverability("not json"), None);
        assert_eq!(parse_persisted_discoverability("{}"), None);
        let file = serde_json::json!({ "app_settings": "{\"state\":{}}" }).to_string();
        assert_eq!(parse_persisted_discoverability(&file), None);
        let envelope = serde_json::json!({ "state": { "discoverability": "bogus" } });
        let file = serde_json::json!({ "app_settings": envelope.to_string() }).to_string();
        assert_eq!(parse_persisted_discoverability(&file), None);
    }

    #[test]
    fn parse_persisted_minimize_to_tray_reads_the_zustand_envelope() {
        let envelope = serde_json::json!({ "state": { "minimizeToTray": false, "darkMode": true }, "version": 0 });
        let file = serde_json::json!({ "app_settings": envelope.to_string() }).to_string();
        assert_eq!(parse_persisted_minimize_to_tray(&file), Some(false));

        let envelope = serde_json::json!({ "state": { "minimizeToTray": true } });
        let file = serde_json::json!({ "app_settings": envelope.to_string() }).to_string();
        assert_eq!(parse_persisted_minimize_to_tray(&file), Some(true));
    }

    #[test]
    fn parse_persisted_minimize_to_tray_tolerates_missing_or_malformed_data() {
        assert_eq!(parse_persisted_minimize_to_tray("not json"), None);
        assert_eq!(parse_persisted_minimize_to_tray("{}"), None);
        let file = serde_json::json!({ "app_settings": "{\"state\":{}}" }).to_string();
        assert_eq!(parse_persisted_minimize_to_tray(&file), None);
        // Wrong type must not panic or coerce.
        let envelope = serde_json::json!({ "state": { "minimizeToTray": "yes" } });
        let file = serde_json::json!({ "app_settings": envelope.to_string() }).to_string();
        assert_eq!(parse_persisted_minimize_to_tray(&file), None);
    }

    #[tokio::test]
    async fn fetch_ticket_metadata_command_e2e() {
        let temp_path = unique_temp_file("sendme-tauri-meta");
        fs::write(&temp_path, b"tauri metadata preview test payload")
            .expect("should create temp payload file");

        let expected_metadata = FileMetadata {
            file_name: "preview-source.txt".to_string(),
            item_count: 1,
            size: 123,
            thumbnail: Some("data:image/jpeg;base64,ZmFrZS10aHVtYg==".to_string()),
            mime_type: Some("text/plain".to_string()),
            items: None,
        };

        let options = SendOptions {
            relay_mode: RelayModeOption::Default,
            discovery_mode: Default::default(),
            ticket_type: AddrInfoOptions::RelayAndAddresses,
            magic_ipv4_addr: None,
            magic_ipv6_addr: None,
        };

        let share = start_share(
            temp_path.clone(),
            options,
            None,
            Some(expected_metadata.clone()),
        )
        .await
        .expect("start_share should succeed");

        let fetched = fetch_ticket_metadata(share.ticket.clone(), None, None)
            .await
            .expect("fetch_ticket_metadata command should succeed");

        assert_eq!(fetched.file_name, expected_metadata.file_name);
        assert_eq!(fetched.size, expected_metadata.size);
        assert_eq!(fetched.thumbnail, expected_metadata.thumbnail);
        assert_eq!(fetched.mime_type, expected_metadata.mime_type);

        drop(share);
        let _ = fs::remove_file(temp_path);
    }
}
