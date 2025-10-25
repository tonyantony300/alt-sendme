use crate::state::{AppStateMutex, ShareHandle};
use sendme::{start_share, download, SendOptions, ReceiveOptions, RelayModeOption, AddrInfoOptions, AppHandle, EventEmitter};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{State, Emitter};

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

#[tauri::command]
pub async fn get_file_size(path: String) -> Result<u64, String> {
    let path = PathBuf::from(path);
    
    if !path.exists() {
        return Err("Path does not exist".to_string());
    }
    
    if path.is_file() {
        match std::fs::metadata(&path) {
            Ok(metadata) => Ok(metadata.len()),
            Err(e) => Err(format!("Failed to get file metadata: {}", e)),
        }
    } else if path.is_dir() {
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
                    // tracing::warn!("Error walking directory: {}", e);
                }
            }
        }
        
        Ok(total_size)
    } else {
        Err("Path is neither a file nor a directory".to_string())
    }
}

#[tauri::command]
pub async fn start_sharing(
    path: String,
    state: State<'_, AppStateMutex>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let path = PathBuf::from(path);
    
    let mut app_state = state.lock().await;
    if app_state.current_share.is_some() {
        return Err("Already sharing a file. Please stop current share first.".to_string());
    }
    
    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }
    
    let options = SendOptions {
        relay_mode: RelayModeOption::Default,
        ticket_type: AddrInfoOptions::RelayAndAddresses,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };
    
    let emitter = Arc::new(TauriEventEmitter {
        app_handle: app_handle.clone(),
    });
    let boxed_handle: AppHandle = Some(emitter);
    
    match start_share(path.clone(), options, boxed_handle).await {
        Ok(result) => {
            let ticket = result.ticket.clone();
            app_state.current_share = Some(ShareHandle::new(ticket.clone(), path, result));
            Ok(ticket)
        }
        Err(e) => {
            Err(format!("Failed to start sharing: {}", e))
        },
    }
}

#[tauri::command]
pub async fn stop_sharing(
    state: State<'_, AppStateMutex>,
) -> Result<(), String> {
    let mut app_state = state.lock().await;
    
    if let Some(mut share) = app_state.current_share.take() {
        if let Err(e) = share.stop().await {
            return Err(e);
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn receive_file(
    ticket: String,
    output_path: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    // tracing::info!("📥 receive_file command called");
    // tracing::info!("🎫 Ticket: {}", &ticket[..50.min(ticket.len())]);
    
    let output_dir = PathBuf::from(output_path);
    let options = ReceiveOptions {
        output_dir: Some(output_dir),
        relay_mode: RelayModeOption::Default,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };
    
    // tracing::info!("📁 Output directory: {:?}", options.output_dir);
    // tracing::info!("🚀 Starting download...");
    
    let emitter = Arc::new(TauriEventEmitter {
        app_handle: app_handle.clone(),
    });
    let boxed_handle: AppHandle = Some(emitter);
    
    match download(ticket, options, boxed_handle).await {
        Ok(result) => {
            // tracing::info!("✅ Download completed successfully: {}", result.message);
            Ok(result.message)
        },
        Err(e) => {
            // tracing::error!("❌ Failed to receive file: {}", e);
            Err(format!("Failed to receive file: {}", e))
        },
    }
}

#[tauri::command]
pub async fn get_sharing_status(
    state: State<'_, AppStateMutex>,
) -> Result<Option<String>, String> {
    let app_state = state.lock().await;
    Ok(app_state.current_share.as_ref().map(|share| share.ticket.clone()))
}

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
pub async fn get_transport_status(
    state: State<'_, AppStateMutex>,
) -> Result<bool, String> {
    let app_state = state.lock().await;
    Ok(app_state.is_transporting)
}
