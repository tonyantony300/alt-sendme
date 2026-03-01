use crate::state::{AppStateMutex, ShareHandle};
use base64::{engine::general_purpose, Engine as _};
use sendme::{
    core::types::FileMetadata, download, fetch_metadata, start_share, AddrInfoOptions, AppHandle,
    EventEmitter, ReceiveOptions, RelayModeOption, SendOptions,
};
use std::io::Cursor;
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

    if path.is_file() {
        // For files, get the file size directly
        match std::fs::metadata(&path) {
            Ok(metadata) => Ok(metadata.len()),
            Err(e) => Err(format!("Failed to get file metadata: {}", e)),
        }
    } else if path.is_dir() {
        // For directories, calculate total size recursively
        let mut total_size = 0u64;

        for entry in walkdir::WalkDir::new(&path) {
            match entry {
                Ok(entry) => {
                    if entry.file_type().is_file() {
                        if let Ok(metadata) = entry.metadata() {
                            total_size += metadata.len();
                        }
                    }
                }
                Err(e) => {
                    tracing::warn!("Error walking directory: {}", e);
                    // Continue with other files
                }
            }
        }

        Ok(total_size)
    } else {
        Err("Path is neither a file nor a directory".to_string())
    }
}

/// Start sharing a file or directory
#[tauri::command]
pub async fn start_sharing(
    path: String,
    state: State<'_, AppStateMutex>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let path = PathBuf::from(path);

    // Check if already sharing
    let mut app_state = state.lock().await;
    if app_state.current_share.is_some() {
        return Err("Already sharing a file. Please stop current share first.".to_string());
    }

    // Validate path exists
    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }

    // Generate thumbnail and build metadata
    let file_name = path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .into_owned();
    let size = get_total_size(&path).unwrap_or(0);
    let thumbnail = generate_thumbnail(&path);
    let description = build_description(&path);

    let metadata = FileMetadata {
        file_name,
        size,
        thumbnail,
        description,
    };

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

    // Start sharing using the core library
    match start_share(path.clone(), options, boxed_handle, Some(metadata)).await {
        Ok(result) => {
            let ticket = result.ticket.clone();
            // CRITICAL: Store the entire SendResult to keep router and temp_tag alive!
            app_state.current_share = Some(ShareHandle::new(ticket.clone(), path, result));
            Ok(ticket)
        }
        Err(e) => Err(format!("Failed to start sharing: {}", e)),
    }
}

/// Fetch metadata from sender by ticket, without starting file download.
#[tauri::command]
pub async fn fetch_ticket_metadata(ticket: String) -> Result<FileMetadata, String> {
    let options = ReceiveOptions {
        output_dir: None,
        relay_mode: RelayModeOption::Default,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };

    fetch_metadata(ticket, options)
        .await
        .map_err(|e| format!("Failed to fetch metadata: {}", e))
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

/// Generate a thumbnail for an image file.
/// # Description
/// Generate thumbnails that maintain aspect ratio and have a maximum size of 128x128 to save on network overhead.
/// # Arguments
/// * `file_path` - The path to the image file for which to generate a thumbnail
/// # Returns
/// An Option containing the base64-encoded thumbnail image if successful, or None if thumbnail generation failed (e.g., if the file is not an image or if there was an error processing it).
pub fn generate_thumbnail(file_path: &Path) -> Option<String> {
    if !file_path.is_file() {
        return None;
    }

    let mime = mime_guess::from_path(file_path).first_or_octet_stream();
    if mime.type_().as_str() != "image" {
        return None;
    }

    if let Ok(img) = image::open(file_path) {
        let thumb = img.thumbnail(128, 128);

        let mut buf = Cursor::new(Vec::new());
        // Use JpegEncoder for compression
        let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, 70);
        encoder.encode_image(&thumb).ok()?;

        let encoded = general_purpose::STANDARD.encode(buf.into_inner());
        Some(encoded)
    } else {
        None
    }
}
/// Helper function to calculate total size of a file or directory
fn get_total_size(path: &Path) -> Option<u64> {
    if path.is_file() {
        return std::fs::metadata(path).ok().map(|m| m.len());
    }

    if path.is_dir() {
        let mut total_size = 0u64;
        for entry in walkdir::WalkDir::new(path) {
            let Ok(entry) = entry else {
                continue;
            };
            if entry.file_type().is_file() {
                if let Ok(metadata) = entry.metadata() {
                    total_size = total_size.saturating_add(metadata.len());
                }
            }
        }
        return Some(total_size);
    }

    None
}

fn build_description(path: &Path) -> Option<String> {
    if !path.is_file() {
        return None;
    }

    let mime = mime_guess::from_path(path).first_or_octet_stream();

    if mime.type_().as_str() == "image" {
        if let Ok(img) = image::open(path) {
            return Some(format!(
                "{} · {}×{}",
                mime.essence_str(),
                img.width(),
                img.height()
            ));
        }
    }

    Some(mime.essence_str().to_string())
}
