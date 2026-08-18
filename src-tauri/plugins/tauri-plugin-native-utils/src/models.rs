use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectDonwloadFolderResponse {
    pub uri: String,
    pub path: String,
}

#[derive(Serialize)]
pub struct SelectItemArgs {
    pub channel: Channel,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AsyncJob {
    pub channel_id: i64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportToTreeArgs {
    pub tree_uri: String,
    pub source_dir: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenDownloadFolderArgs {
    pub tree_uri: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportToMediaStoreArgs {
    pub source_dir: String,
}

/// Empty `uri` opens the system Downloads list instead of a single file.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenDownloadTargetArgs {
    pub uri: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportToTreeConflict {
    pub original: String,
    pub resolved: String,
}

/// System bar and display cutout insets, in CSS pixels.
#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowInsets {
    pub top: f64,
    pub right: f64,
    pub bottom: f64,
    pub left: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportToTreeResult {
    pub exported_count: u32,
    pub conflicts: Vec<ExportToTreeConflict>,
}

/// Error text the Android side returns when the device predates scoped
/// storage, signalling that the caller should keep files in app-private
/// staging rather than treat the export as a hard failure.
pub const MEDIA_STORE_UNSUPPORTED: &str = "MEDIA_STORE_UNSUPPORTED";

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportToMediaStoreResult {
    pub exported_count: u32,
    pub conflicts: Vec<ExportToTreeConflict>,
    /// One `content://` URI per exported file, in export order.
    pub uris: Vec<String>,
    /// Human-readable destination, e.g. `Download/DashBeam`.
    pub display_path: String,
}
