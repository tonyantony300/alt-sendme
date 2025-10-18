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
    tracing::info!("📤 start_sharing command called with path: {}", path);
    let path = PathBuf::from(path);
    
    // Check if already sharing
    let mut app_state = state.lock().await;
    if app_state.current_share.is_some() {
        tracing::warn!("⚠️  Already sharing a file");
        return Err("Already sharing a file. Please stop current share first.".to_string());
    }
    
    // Validate path exists
    if !path.exists() {
        tracing::error!("❌ Path does not exist: {}", path.display());
        return Err(format!("Path does not exist: {}", path.display()));
    }
    
    tracing::info!("✅ Path validation passed");
    
    // Create send options with defaults
    let options = SendOptions {
        relay_mode: RelayModeOption::Default,
        ticket_type: AddrInfoOptions::RelayAndAddresses,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };
    
    tracing::info!("🚀 Starting share with options: {:?}", options);
    
    // Start sharing using the core library
    match start_share(path.clone(), options).await {
        Ok(result) => {
            let ticket = result.ticket.clone();
            tracing::info!("✅ Share started successfully, ticket: {}", &ticket[..50.min(ticket.len())]);
            // CRITICAL: Store the entire SendResult to keep router and temp_tag alive!
            app_state.current_share = Some(ShareHandle::new(ticket.clone(), path, result));
            Ok(ticket)
        }
        Err(e) => {
            tracing::error!("❌ Failed to start sharing: {}", e);
            Err(format!("Failed to start sharing: {}", e))
        },
    }
}

/// Stop the current sharing session
#[tauri::command]
pub async fn stop_sharing(
    state: State<'_, AppStateMutex>,
) -> Result<(), String> {
    tracing::info!("🛑 stop_sharing command called");
    let mut app_state = state.lock().await;
    
    if let Some(mut share) = app_state.current_share.take() {
        // Explicitly clean up the share session
        if let Err(e) = share.stop().await {
            tracing::error!("❌ Failed to clean up share session: {}", e);
            return Err(e);
        }
        tracing::info!("✅ Sharing stopped and cleaned up successfully");
    } else {
        tracing::info!("ℹ️  No active share to stop");
    }
    
    Ok(())
}

/// Receive a file using a ticket
#[tauri::command]
pub async fn receive_file(
    ticket: String,
) -> Result<String, String> {
    tracing::info!("📥 receive_file command called");
    tracing::info!("🎫 Ticket: {}", &ticket[..50.min(ticket.len())]);
    
    // Create receive options with Downloads folder as default
    let options = ReceiveOptions {
        output_dir: Some(dirs::download_dir().unwrap_or_else(|| std::env::current_dir().unwrap())),
        relay_mode: RelayModeOption::Default,
        magic_ipv4_addr: None,
        magic_ipv6_addr: None,
    };
    
    tracing::info!("📁 Output directory: {:?}", options.output_dir);
    tracing::info!("🚀 Starting download...");
    
    // Download using the core library
    match download(ticket, options).await {
        Ok(result) => {
            tracing::info!("✅ Download completed successfully: {}", result.message);
            Ok(result.message)
        },
        Err(e) => {
            tracing::error!("❌ Failed to receive file: {}", e);
            Err(format!("Failed to receive file: {}", e))
        },
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
