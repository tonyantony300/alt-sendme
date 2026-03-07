use crate::features::thumbnail::generate_thumbnail;
use crate::state::{AppStateMutex, ShareHandle};
use sendme::{
    core::types::FileMetadata, download, fetch_metadata, start_share, AddrInfoOptions, AppHandle,
    EventEmitter, ReceiveOptions, RelayModeOption, SendOptions,
};
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, State};

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

/// Start sharing a file or directory
#[tauri::command]
pub async fn start_sharing(
    path: String,
    state: State<'_, AppStateMutex>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let path = PathBuf::from(path);

    // Validate path exists before doing any work.
    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }

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
        let file_name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned();

        // Run heavy size calculation in a separate blocking thread
        let path_clone = path.clone();
        let size = tokio::task::spawn_blocking(move || get_total_size(&path_clone))
            .await
            .map_err(|e| format!("Task join error: {}", e))?;
        let size = size?;

        // Generate thumbnail (async, internally handles blocking operations)
        let thumbnail = generate_thumbnail(&path).await;

        let mime_type = if path.is_file() {
            Some(
                mime_guess::from_path(&path)
                    .first_or_octet_stream()
                    .essence_str()
                    .to_string(),
            )
        } else {
            Some("inode/directory".to_string())
        };

        let metadata = FileMetadata {
            file_name,
            size,
            thumbnail,
            mime_type,
        };

        tracing::info!(
            path_stem = ?path.file_stem(),
            size = metadata.size,
            has_thumbnail = metadata.thumbnail.is_some(),
            "share metadata prepared"
        );

        // Create send options with defaults
        let options = SendOptions {
            relay_mode: RelayModeOption::Default,
            ticket_type: AddrInfoOptions::RelayAndAddresses,
            magic_ipv4_addr: None,
            magic_ipv6_addr: None,
        };

        // Wrap the app_handle in our EventEmitter implementation
        let emitter = Arc::new(TauriEventEmitter {
            app_handle: app_handle.clone(),
        });
        let boxed_handle: AppHandle = Some(emitter);

        let result = start_share(path.clone(), options, boxed_handle, Some(metadata))
            .await
            .map_err(|e| format!("Failed to start sharing: {}", e))?;

        let ticket = result.ticket.clone();
        Ok((ticket, result))
    }
    .await;

    match start_result {
        Ok((ticket, result)) => {
            // Clear reservation and install active share atomically.
            let mut app_state = state.lock().await;
            app_state.is_share_starting = false;

            if app_state.current_share.is_some() {
                drop(app_state);

                // Defensive cleanup in case state was externally changed.
                let mut orphan_share = ShareHandle::new(ticket, path, result);
                if let Err(err) = orphan_share.stop().await {
                    tracing::warn!(error = %err, "failed to stop concurrent orphan share");
                }

                return Err("Already sharing a file. Please stop current share first.".to_string());
            }

            // CRITICAL: Store the entire SendResult to keep router and temp_tag alive!
            app_state.current_share = Some(ShareHandle::new(ticket.clone(), path, result));
            Ok(ticket)
        }
        Err(err) => {
            let mut app_state = state.lock().await;
            app_state.is_share_starting = false;
            Err(err)
        }
    }
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

// TODO: Unimplemented because settings route is WIP
/*
/// Register Windows Context Menu
#[tauri::command]
pub async fn register_context_menu() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        crate::platform::windows::context_menu::register_context_menu().map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "windows"))]
    Ok(())
}

/// Unregister Windows Context Menu
#[tauri::command]
pub async fn unregister_context_menu() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // crate::platform::windows::context_menu::unregister_context_menu().map_err(|e| e.to_string())
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    Ok(())
}
*/

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
            size: 123,
            thumbnail: Some("data:image/jpeg;base64,ZmFrZS10aHVtYg==".to_string()),
            mime_type: Some("text/plain".to_string()),
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
