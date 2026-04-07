use crate::features::thumbnail::generate_thumbnail;
use crate::state::{AppStateMutex, ShareHandle};
use sendme::{
    core::types::{FileMetadata, FilePreviewItem},
    download, fetch_metadata, AddrInfoOptions, AppHandle, EventEmitter, ReceiveOptions,
    RelayModeOption, SendOptions,
};
use std::collections::BTreeMap;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, Manager, State};

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
    state: State<'_, AppStateMutex>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    send_items(vec![path], state, app_handle).await
}

/// New interface to start_sharing multiple items at once
#[tauri::command]
pub async fn send_items(
    paths: Vec<String>,
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

        // Create send options with defaults.
        let options = SendOptions {
            relay_mode: RelayModeOption::Default,
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
        let result = sendme::core::send::start_share_items(
            path_bufs.clone(),
            options,
            &boxed_handle,
            Some(metadata),
        )
        .await
        .map_err(|e| format!("Failed to start sharing: {}", e))?;
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
pub async fn fetch_ticket_metadata(ticket: String) -> Result<FileMetadata, String> {
    let ticket_len = ticket.len();
    tracing::info!(ticket_len, "fetch_ticket_metadata called");

    let options = ReceiveOptions {
        output_dir: None,
        relay_mode: RelayModeOption::Default,
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
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    // Create receive options with user-specified output path
    let output_dir = PathBuf::from(output_path);
    let options = ReceiveOptions {
        output_dir: Some(output_dir),
        relay_mode: RelayModeOption::Default,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };

    // Wrap the app_handle in our EventEmitter implementation
    let emitter = Arc::new(TauriEventEmitter {
        app_handle: app_handle.clone(),
    });
    let boxed_handle: AppHandle = Some(emitter);

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

fn collect_path_preview_files(
    path: &Path,
    root_name: &str,
) -> Result<Vec<(String, PathBuf)>, String> {
    if path.is_file() {
        return Ok(vec![(root_name.to_string(), path.to_path_buf())]);
    }

    if path.is_dir() {
        let mut out = Vec::new();
        for entry in walkdir::WalkDir::new(path) {
            let entry = entry.map_err(|e| format!("Failed to traverse {}: {e}", path.display()))?;
            if !entry.file_type().is_file() {
                continue;
            }

            let rel = entry.path().strip_prefix(path).map_err(|e| {
                format!(
                    "Failed to strip prefix for {} against {}: {e}",
                    entry.path().display(),
                    path.display()
                )
            })?;

            let relative_path = if rel.as_os_str().is_empty() {
                PathBuf::from(root_name)
            } else {
                let mut prefixed = PathBuf::from(root_name);
                prefixed.push(rel);
                prefixed
            };
            let safe_name = relative_path.to_string_lossy().replace('\\', "/");
            out.push((safe_name, entry.path().to_path_buf()));
        }
        return Ok(out);
    }

    Err(format!(
        "Path is neither a file nor a directory: {}",
        path.display()
    ))
}

async fn collect_preview_items(paths: &[PathBuf]) -> Result<Vec<FilePreviewItem>, String> {
    let mut entries: Vec<(String, PathBuf)> = Vec::new();
    let mut seen_names = BTreeMap::new();

    for path in paths {
        let root_name = path
            .file_name()
            .and_then(|name| name.to_str())
            .filter(|name| !name.is_empty())
            .unwrap_or("item");

        let collected = collect_path_preview_files(path, root_name)?;
        for (name, file_path) in collected {
            let final_name = dedup_name(&name, &mut seen_names);
            entries.push((final_name, file_path));
        }
    }

    entries.sort_by(|a, b| a.0.cmp(&b.0));

    let mut items = Vec::with_capacity(entries.len());
    for (file_name, file_path) in entries {
        let metadata = std::fs::metadata(&file_path)
            .map_err(|e| format!("Failed to read metadata for {}: {e}", file_path.display()))?;
        let mime_type = Some(
            mime_guess::from_path(&file_path)
                .first_or_octet_stream()
                .essence_str()
                .to_string(),
        );
        let thumbnail = generate_thumbnail(&file_path).await;
        items.push(FilePreviewItem {
            file_name,
            size: metadata.len(),
            thumbnail,
            mime_type,
        });
    }

    Ok(items)
}

#[cfg(test)]
mod tests {
    use super::*;
    use sendme::start_share;
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

        let fetched = fetch_ticket_metadata(share.ticket.clone())
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
