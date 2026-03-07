use base64::{engine::general_purpose, Engine as _};
use std::path::Path;

/// # Description
/// Generates a thumbnail for a video file by capturing the first second frame and encoding
/// it as a base64 string.
///
/// # Returns
/// `Some(String)` containing the base64-encoded thumbnail if successful,
/// or `None` if the file is not a valid video or an error occurs during processing.
pub async fn generate_video_thumbnail(file_path: &Path) -> Option<String> {
    if !file_path.is_file() {
        return None;
    }

    match crate::platform::video_thumbnail::capture_first_second_frame_jpeg(file_path).await {
        Ok(bytes) => Some(general_purpose::STANDARD.encode(bytes)),
        Err(err) => {
            let file_name = file_path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("<unknown>");
            tracing::warn!(
                file_name = %file_name,
                error = %err,
                "video thumbnail generation failed"
            );
            None
        }
    }
}
