use crate::features::thumbnail::generate_thumbnail;
use crate::state::{AppStateMutex, ShareHandle};
use engine::{
    core::types::{get_or_create_secret, FileMetadata, FilePreviewItem},
    download, fetch_metadata, AddrInfoOptions, AppHandle, EventEmitter, ReceiveOptions,
    RelayModeOption, SendOptions,
};
use iroh::{endpoint::presets, Endpoint};
use n0_watcher::Watcher;
use std::collections::BTreeMap;
use std::net::IpAddr;
use std::path::Path;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;
use tauri::{Emitter, Manager, State};

#[derive(Debug, Clone, serde::Deserialize)]
pub struct RelayConfigArg {
    pub mode: String,
    pub urls: Vec<String>,
    pub auth_token: Option<String>,
    pub fallback: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RelayFallbackPolicy {
    Strict,
    Public,
}

const MAX_RELAY_URL_LENGTH: usize = 2048;
const MAX_RELAY_AUTH_TOKEN_LENGTH: usize = 4096;

fn has_disallowed_relay_text_char(value: &str) -> bool {
    value
        .chars()
        .any(|char| char.is_control() || char.is_whitespace())
}

fn normalize_relay_auth_token(value: Option<String>) -> Result<Option<String>, String> {
    let Some(value) = value else {
        return Ok(None);
    };
    if value.trim().is_empty() {
        return Err("Relay auth token must not be empty".to_string());
    }
    if value.len() > MAX_RELAY_AUTH_TOKEN_LENGTH {
        return Err("Relay auth token is too long".to_string());
    }
    if has_disallowed_relay_text_char(&value) {
        return Err(
            "Relay auth token must not contain whitespace or control characters".to_string(),
        );
    }
    Ok(Some(value))
}

fn is_loopback_relay_host(host: &str) -> bool {
    if host.eq_ignore_ascii_case("localhost") {
        return true;
    }

    host.parse::<IpAddr>()
        .map(|addr| addr.is_loopback())
        .unwrap_or(false)
}

fn parse_relay_url_for_ipc(url: &str, has_auth_token: bool) -> Result<iroh::RelayUrl, String> {
    if url.is_empty() {
        return Err("Relay URL must not be empty".to_string());
    }
    if url.len() > MAX_RELAY_URL_LENGTH {
        return Err("Relay URL is too long".to_string());
    }
    if has_disallowed_relay_text_char(url) {
        return Err("Relay URL must not contain whitespace or control characters".to_string());
    }

    let relay_url = iroh::RelayUrl::from_str(url).map_err(|_| "Invalid relay URL".to_string())?;
    if relay_url.username() != "" || relay_url.password().is_some() {
        return Err("Relay URL must not include a username or password".to_string());
    }

    let host = relay_url
        .host_str()
        .ok_or_else(|| "Relay URL must include a host".to_string())?;

    match relay_url.scheme() {
        "https" => Ok(relay_url),
        "http" if !has_auth_token && is_loopback_relay_host(host) => Ok(relay_url),
        "http" if has_auth_token => {
            Err("Relay URLs must use https when an auth token is configured".to_string())
        }
        "http" => Err("Plain HTTP relay URLs are only allowed for loopback hosts".to_string()),
        _ => Err("Relay URL scheme must be https or loopback http".to_string()),
    }
}

pub fn build_relay_mode(arg: Option<RelayConfigArg>) -> Result<RelayModeOption, String> {
    match arg {
        None => Ok(RelayModeOption::Default),
        Some(arg) => match arg.mode.as_str() {
            "default" => Ok(RelayModeOption::Default),
            "disabled" => Ok(RelayModeOption::Disabled),
            "custom" => {
                if arg.urls.is_empty() {
                    return Err("At least one relay URL is required for custom mode".to_string());
                }
                let auth_token = normalize_relay_auth_token(arg.auth_token)?;
                let has_auth_token = auth_token.is_some();
                let urls = arg
                    .urls
                    .iter()
                    .map(|url| parse_relay_url_for_ipc(url, has_auth_token))
                    .collect::<Result<Vec<_>, _>>()?;
                Ok(RelayModeOption::Custom { urls, auth_token })
            }
            other => Err(format!("Invalid relay mode: {other}")),
        },
    }
}

pub fn relay_fallback_policy(arg: &RelayConfigArg) -> Result<RelayFallbackPolicy, String> {
    match arg.fallback.as_deref().unwrap_or("strict") {
        "strict" => Ok(RelayFallbackPolicy::Strict),
        "public" => Ok(RelayFallbackPolicy::Public),
        other => Err(format!("Invalid relay fallback policy: {other}")),
    }
}

const RELAY_PROBE_TIMEOUT: Duration = Duration::from_secs(15);

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RelayStatusResponse {
    pub kind: String,
    pub url: Option<String>,
    pub connected: bool,
    pub fell_back_to_public: bool,
}

pub fn is_public_relay_url(url: &str) -> bool {
    url.contains("relay.n0.iroh.link") || url.contains(".iroh.link")
}

fn connected_home_relay_url(endpoint: &Endpoint) -> Option<String> {
    endpoint
        .home_relay_status()
        .get()
        .into_iter()
        .find(|status| status.is_connected())
        .map(|status| status.url().to_string())
}

async fn probe_relay_mode(relay_mode: RelayModeOption) -> Result<Option<String>, String> {
    if matches!(relay_mode, RelayModeOption::Disabled) {
        return Ok(None);
    }

    let secret_key = get_or_create_secret().map_err(|e| e.to_string())?;
    let endpoint = Endpoint::builder(presets::Minimal)
        .secret_key(secret_key)
        .relay_mode(relay_mode.into())
        .bind()
        .await
        .map_err(|e| format!("Failed to bind endpoint: {e}"))?;

    let online_result = tokio::time::timeout(RELAY_PROBE_TIMEOUT, endpoint.online()).await;

    let url = connected_home_relay_url(&endpoint);
    endpoint.close().await;

    online_result.map_err(|_| "Timed out waiting for relay connection".to_string())?;
    Ok(url)
}

fn apply_custom_relay_probe_result(
    preferred: RelayModeOption,
    fallback: RelayFallbackPolicy,
    probe_result: Result<Option<String>, String>,
) -> Result<(RelayModeOption, bool), String> {
    if let Ok(Some(_)) = probe_result {
        return Ok((preferred, false));
    }

    match fallback {
        RelayFallbackPolicy::Strict => {
            Err("Custom relay unreachable and strict fallback policy is enabled".to_string())
        }
        RelayFallbackPolicy::Public => {
            tracing::warn!(
                "Custom relay unreachable within {}s; falling back to public relays",
                RELAY_PROBE_TIMEOUT.as_secs()
            );
            Ok((RelayModeOption::Default, true))
        }
    }
}

fn relay_fallback_event_payload(
    stage: &'static str,
    fell_back_to_public: bool,
) -> Option<&'static str> {
    fell_back_to_public.then_some(stage)
}

/// Prefer configured custom relays; fall back to public relays only when selected.
pub async fn resolve_relay_mode_with_fallback(
    arg: Option<RelayConfigArg>,
) -> Result<(RelayModeOption, bool), String> {
    let fallback = arg
        .as_ref()
        .map(relay_fallback_policy)
        .transpose()?
        .unwrap_or(RelayFallbackPolicy::Strict);
    let preferred = build_relay_mode(arg)?;

    match &preferred {
        RelayModeOption::Disabled | RelayModeOption::Default => Ok((preferred, false)),
        RelayModeOption::Custom { .. } => {
            let probe =
                tokio::time::timeout(RELAY_PROBE_TIMEOUT, probe_relay_mode(preferred.clone()))
                    .await;

            let probe_result = match probe {
                Ok(result) => result,
                Err(_) => Err("Timed out waiting for relay connection".to_string()),
            };
            apply_custom_relay_probe_result(preferred, fallback, probe_result)
        }
    }
}

/// Check which relay the app can reach, with public fallback only when selected.
#[tauri::command]
pub async fn get_relay_status(
    relay: Option<RelayConfigArg>,
) -> Result<RelayStatusResponse, String> {
    let fallback = relay
        .as_ref()
        .map(relay_fallback_policy)
        .transpose()?
        .unwrap_or(RelayFallbackPolicy::Strict);
    let preferred = build_relay_mode(relay.clone())?;

    if matches!(preferred, RelayModeOption::Disabled) {
        return Ok(RelayStatusResponse {
            kind: "disabled".to_string(),
            url: None,
            connected: false,
            fell_back_to_public: false,
        });
    }

    if let RelayModeOption::Custom { .. } = &preferred {
        let custom_probe =
            tokio::time::timeout(RELAY_PROBE_TIMEOUT, probe_relay_mode(preferred.clone())).await;

        if let Ok(Ok(Some(url))) = custom_probe {
            return Ok(RelayStatusResponse {
                kind: if is_public_relay_url(&url) {
                    "public".to_string()
                } else {
                    "custom".to_string()
                },
                url: Some(url),
                connected: true,
                fell_back_to_public: false,
            });
        }

        if matches!(fallback, RelayFallbackPolicy::Strict) {
            return Ok(RelayStatusResponse {
                kind: "unavailable".to_string(),
                url: None,
                connected: false,
                fell_back_to_public: false,
            });
        }

        tracing::warn!("Custom relay unreachable; checking public relay fallback");
        let public_probe = tokio::time::timeout(
            RELAY_PROBE_TIMEOUT,
            probe_relay_mode(RelayModeOption::Default),
        )
        .await;

        if let Ok(Ok(Some(url))) = public_probe {
            return Ok(RelayStatusResponse {
                kind: "public".to_string(),
                url: Some(url),
                connected: true,
                fell_back_to_public: true,
            });
        }

        return Ok(RelayStatusResponse {
            kind: "unavailable".to_string(),
            url: None,
            connected: false,
            fell_back_to_public: false,
        });
    }

    let public_probe = tokio::time::timeout(
        RELAY_PROBE_TIMEOUT,
        probe_relay_mode(RelayModeOption::Default),
    )
    .await;

    if let Ok(Ok(Some(url))) = public_probe {
        return Ok(RelayStatusResponse {
            kind: "public".to_string(),
            url: Some(url),
            connected: true,
            fell_back_to_public: false,
        });
    }

    Ok(RelayStatusResponse {
        kind: "unavailable".to_string(),
        url: None,
        connected: false,
        fell_back_to_public: false,
    })
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
    state: State<'_, AppStateMutex>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    send_items(vec![path], relay, state, app_handle).await
}

/// New interface to start_sharing multiple items at once
#[tauri::command]
pub async fn send_items(
    paths: Vec<String>,
    relay: Option<RelayConfigArg>,
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
        let options = SendOptions {
            relay_mode,
            ticket_type: AddrInfoOptions::RelayAndAddresses,
            magic_ipv4_addr: None,
            magic_ipv6_addr: None,
        };

        // Wrap the app_handle in our EventEmitter implementation.
        let emitter = Arc::new(TauriEventEmitter {
            app_handle: app_handle.clone(),
        });
        let boxed_handle: AppHandle = Some(emitter);

        // Start sharing multiple files/folders via core send pipeline.
        let result = engine::core::send::start_share_items(
            path_bufs.clone(),
            options,
            &boxed_handle,
            Some(metadata),
        )
        .await
        .map_err(|e| format!("Failed to start sharing: {}", e))?;
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
) -> Result<FileMetadata, String> {
    let ticket_len = ticket.len();
    tracing::info!(ticket_len, "fetch_ticket_metadata called");

    let (relay_mode, _) = resolve_relay_mode_with_fallback(relay).await?;
    let options = ReceiveOptions {
        output_dir: None,
        relay_mode,
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
        // Explicitly clean up the share session
        if let Err(e) = share.stop().await {
            return Err(e);
        }

        #[cfg(target_os = "android")]
        std::fs::remove_dir_all(&share._path);
    }

    Ok(())
}

/// Receive a file using a ticket
#[tauri::command]
pub async fn receive_file(
    ticket: String,
    output_path: String,
    relay: Option<RelayConfigArg>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    // Create receive options with user-specified output path
    let output_dir = PathBuf::from(output_path);
    let (relay_mode, fell_back_to_public) = resolve_relay_mode_with_fallback(relay).await?;
    let options = ReceiveOptions {
        output_dir: Some(output_dir),
        relay_mode,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };

    // Wrap the app_handle in our EventEmitter implementation
    let emitter = Arc::new(TauriEventEmitter {
        app_handle: app_handle.clone(),
    });
    let boxed_handle: AppHandle = Some(emitter);

    if let Some(payload) = relay_fallback_event_payload("receive", fell_back_to_public) {
        // Notify before the receive path starts using the resolved public relay.
        let _ = app_handle.emit("relay-fell-back", payload);
    }

    // Download using the core library
    match download(ticket, options, boxed_handle).await {
        Ok(result) => Ok(result.message),
        Err(e) => {
            tracing::error!("Failed to receive file: {}", e);
            Err(format!("Failed to receive file: {}", e))
        }
    }
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
pub async fn toggle_context_menu(enable: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        if enable {
            crate::platform::windows::context_menu::register_context_menu()
                .map_err(|e| e.to_string())
        } else {
            crate::platform::windows::context_menu::unregister_context_menu()
                .map_err(|e| e.to_string())
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = enable;
        Ok(())
    }
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

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyRelaysResponse {
    /// The relay the endpoint actually registered with (home relay).
    pub url: Option<String>,
    /// Time taken to establish the relay connection, in milliseconds.
    pub latency_ms: u64,
}

/// Verify connectivity to configured relay servers.
#[tauri::command]
pub async fn verify_relays(relay: RelayConfigArg) -> Result<VerifyRelaysResponse, String> {
    let relay_mode = build_relay_mode(Some(relay))?;

    if matches!(relay_mode, RelayModeOption::Disabled) {
        return Err("Relay verification requires default or custom relay mode".to_string());
    }

    let secret_key = get_or_create_secret().map_err(|e| e.to_string())?;

    let endpoint = Endpoint::builder(presets::Minimal)
        .secret_key(secret_key)
        .relay_mode(relay_mode.into())
        .bind()
        .await
        .map_err(|e| format!("Failed to bind endpoint: {e}"))?;

    let started = std::time::Instant::now();

    tokio::time::timeout(RELAY_PROBE_TIMEOUT, endpoint.online())
        .await
        .map_err(|_| {
            format!(
                "Timed out waiting for relay connection ({}s)",
                RELAY_PROBE_TIMEOUT.as_secs()
            )
        })?;

    let latency_ms = started.elapsed().as_millis() as u64;
    let url = connected_home_relay_url(&endpoint);

    endpoint.close().await;
    Ok(VerifyRelaysResponse { url, latency_ms })
}

#[cfg(test)]
mod relay_config_tests {
    use super::*;

    fn custom_relay_arg(fallback: Option<&str>) -> RelayConfigArg {
        RelayConfigArg {
            mode: "custom".to_string(),
            urls: vec!["https://relay.example.com".to_string()],
            auth_token: None,
            fallback: fallback.map(str::to_string),
        }
    }

    #[test]
    fn build_relay_mode_defaults_to_public() {
        let mode = build_relay_mode(None).expect("default mode should parse");
        assert!(matches!(mode, RelayModeOption::Default));
    }

    #[test]
    fn build_relay_mode_custom_with_auth() {
        let mode = build_relay_mode(Some(RelayConfigArg {
            mode: "custom".to_string(),
            urls: vec!["https://relay.example.com".to_string()],
            auth_token: Some("secret".to_string()),
            fallback: None,
        }))
        .expect("custom mode should parse");

        match mode {
            RelayModeOption::Custom { urls, auth_token } => {
                assert_eq!(urls.len(), 1);
                assert_eq!(auth_token.as_deref(), Some("secret"));
            }
            _ => panic!("expected custom relay mode"),
        }
    }

    #[test]
    fn build_relay_mode_custom_requires_urls() {
        let err = build_relay_mode(Some(RelayConfigArg {
            mode: "custom".to_string(),
            urls: vec![],
            auth_token: None,
            fallback: None,
        }))
        .expect_err("empty custom urls should fail");
        assert!(err.contains("At least one relay URL"));
    }

    #[test]
    fn build_relay_mode_rejects_auth_token_over_http() {
        let err = build_relay_mode(Some(RelayConfigArg {
            mode: "custom".to_string(),
            urls: vec!["http://127.0.0.1:3340".to_string()],
            auth_token: Some("secret".to_string()),
            fallback: None,
        }))
        .expect_err("auth tokens must not be sent over cleartext relay urls");

        assert!(err.contains("https"));
    }

    #[test]
    fn build_relay_mode_allows_loopback_http_without_auth_token() {
        let mode = build_relay_mode(Some(RelayConfigArg {
            mode: "custom".to_string(),
            urls: vec!["http://127.0.0.1:3340".to_string()],
            auth_token: None,
            fallback: None,
        }))
        .expect("loopback http relay is allowed for local development without auth");

        assert!(matches!(mode, RelayModeOption::Custom { .. }));
    }

    #[test]
    fn build_relay_mode_rejects_embedded_url_credentials_without_echoing_them() {
        let err = build_relay_mode(Some(RelayConfigArg {
            mode: "custom".to_string(),
            urls: vec!["https://user:password@relay.example.com".to_string()],
            auth_token: None,
            fallback: None,
        }))
        .expect_err("relay urls must not carry embedded credentials");

        assert!(err.contains("username or password"));
        assert!(!err.contains("user:password"));
    }

    #[test]
    fn build_relay_mode_rejects_auth_token_whitespace() {
        let err = build_relay_mode(Some(RelayConfigArg {
            mode: "custom".to_string(),
            urls: vec!["https://relay.example.com".to_string()],
            auth_token: Some("secret token".to_string()),
            fallback: None,
        }))
        .expect_err("bearer tokens must not contain whitespace");

        assert!(err.contains("auth token"));
    }

    #[test]
    fn build_relay_mode_rejects_auth_token_leading_or_trailing_whitespace() {
        let err = build_relay_mode(Some(RelayConfigArg {
            mode: "custom".to_string(),
            urls: vec!["https://relay.example.com".to_string()],
            auth_token: Some(" secret ".to_string()),
            fallback: None,
        }))
        .expect_err("bearer tokens must not be silently trimmed");

        assert!(err.contains("auth token"));
    }

    #[test]
    fn build_relay_mode_rejects_empty_auth_token() {
        let err = build_relay_mode(Some(RelayConfigArg {
            mode: "custom".to_string(),
            urls: vec!["https://relay.example.com".to_string()],
            auth_token: Some("".to_string()),
            fallback: None,
        }))
        .expect_err("explicitly empty bearer tokens must fail closed");

        assert!(err.contains("must not be empty"));
    }

    #[test]
    fn build_relay_mode_rejects_blank_auth_token() {
        let err = build_relay_mode(Some(RelayConfigArg {
            mode: "custom".to_string(),
            urls: vec!["https://relay.example.com".to_string()],
            auth_token: Some(" \t ".to_string()),
            fallback: None,
        }))
        .expect_err("blank bearer tokens must not be silently cleared");

        assert!(err.contains("must not be empty"));
    }

    #[test]
    fn build_relay_mode_rejects_oversized_auth_token() {
        let err = build_relay_mode(Some(RelayConfigArg {
            mode: "custom".to_string(),
            urls: vec!["https://relay.example.com".to_string()],
            auth_token: Some("a".repeat(MAX_RELAY_AUTH_TOKEN_LENGTH + 1)),
            fallback: None,
        }))
        .expect_err("bearer tokens must have a bounded size");

        assert!(err.contains("too long"));
    }

    #[test]
    fn relay_config_missing_fallback_defaults_to_strict() {
        let arg: RelayConfigArg = serde_json::from_str(
            r#"{"mode":"custom","urls":["https://relay.example.com"],"auth_token":null}"#,
        )
        .expect("old frontend payloads should still deserialize");

        assert_eq!(
            relay_fallback_policy(&arg).expect("policy should parse"),
            RelayFallbackPolicy::Strict
        );
    }

    #[test]
    fn strict_custom_relay_probe_failure_fails_closed() {
        let preferred = build_relay_mode(Some(custom_relay_arg(Some("strict"))))
            .expect("custom mode should parse");
        let err = apply_custom_relay_probe_result(
            preferred,
            RelayFallbackPolicy::Strict,
            Err("Timed out waiting for relay connection".to_string()),
        )
        .expect_err("strict fallback should fail closed");

        assert!(err.contains("Custom relay unreachable"));
    }

    #[test]
    fn public_custom_relay_probe_failure_falls_back_to_public() {
        let preferred = build_relay_mode(Some(custom_relay_arg(Some("public"))))
            .expect("custom mode should parse");
        let (mode, fell_back) = apply_custom_relay_probe_result(
            preferred,
            RelayFallbackPolicy::Public,
            Err("Timed out waiting for relay connection".to_string()),
        )
        .expect("public fallback should use default relays");

        assert!(matches!(mode, RelayModeOption::Default));
        assert!(fell_back);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use engine::start_share;
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

        let fetched = fetch_ticket_metadata(share.ticket.clone(), None)
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
