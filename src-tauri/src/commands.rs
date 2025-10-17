use crate::state::{AppStateMutex, ShareHandle};
use sendme::{start_share, download, SendOptions, ReceiveOptions, RelayModeOption, AddrInfoOptions};
use std::path::PathBuf;
use tauri::State;

/// Start sharing a file or directory
#[tauri::command]
pub async fn start_sharing(
    path: String,
    state: State<'_, AppStateMutex>,
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
    
    // Create send options with defaults
    let options = SendOptions {
        relay_mode: RelayModeOption::Default,
        ticket_type: AddrInfoOptions::RelayAndAddresses,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };
    
    // Start sharing using the core library
    match start_share(path.clone(), options).await {
        Ok(result) => {
            // Store the share handle
            app_state.current_share = Some(ShareHandle::new(result.ticket.clone(), path));
            Ok(result.ticket)
        }
        Err(e) => Err(format!("Failed to start sharing: {}", e)),
    }
}

/// Stop the current sharing session
#[tauri::command]
pub async fn stop_sharing(
    state: State<'_, AppStateMutex>,
) -> Result<(), String> {
    let mut app_state = state.lock().await;
    app_state.current_share = None;
    Ok(())
}

/// Receive a file using a ticket
#[tauri::command]
pub async fn receive_file(
    ticket: String,
) -> Result<String, String> {
    // Create receive options with Downloads folder as default
    let options = ReceiveOptions {
        output_dir: Some(dirs::download_dir().unwrap_or_else(|| std::env::current_dir().unwrap())),
        relay_mode: RelayModeOption::Default,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };
    
    // Download using the core library
    match download(ticket, options).await {
        Ok(result) => Ok(result.message),
        Err(e) => Err(format!("Failed to receive file: {}", e)),
    }
}

/// Get the current sharing status
#[tauri::command]
pub async fn get_sharing_status(
    state: State<'_, AppStateMutex>,
) -> Result<Option<String>, String> {
    let app_state = state.lock().await;
    Ok(app_state.current_share.as_ref().map(|share| share.ticket.clone()))
}
