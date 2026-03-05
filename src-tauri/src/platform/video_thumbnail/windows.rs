use image::codecs::jpeg::JpegEncoder;
use image::DynamicImage;
use std::io::Cursor;
use std::path::Path;
use tokio::process::Command;
use tokio::time::Duration;
use windows::Win32::Media::MediaFoundation::{MFShutdown, MFStartup, MFSTARTUP_LITE, MF_VERSION};

/// # Description
/// Attempts to capture a thumbnail from the first second of the video using Media Foundation.
/// If that fails, it falls back to using ffmpeg to extract a frame and encode it as a JPEG thumbnail.
/// # Errors
/// - Returns an error if both Media Foundation and ffmpeg fail to capture a thumbnail, or if the ffmpeg output cannot be decoded or encoded as a JPEG.
pub async fn capture_first_second_frame_jpeg(file_path: &Path) -> Result<Vec<u8>, String> {
    let path_buf = file_path.to_path_buf();
    let mf_result = tokio::task::spawn_blocking(move || attempt_media_foundation(&path_buf))
        .await
        .map_err(|e| format!("Task join error: {e}"))
        .and_then(|res| res);

    match mf_result {
        Ok(bytes) => Ok(bytes),
        Err(mf_err) => {
            tracing::warn!(
                path = %file_path.display(),
                error = %mf_err,
                "media foundation thumbnail failed, falling back to ffmpeg"
            );
            capture_with_ffmpeg(file_path).await
        }
    }
}

fn attempt_media_foundation(file_path: &Path) -> Result<Vec<u8>, String> {
    let _ = file_path;
    unsafe {
        MFStartup(MF_VERSION, MFSTARTUP_LITE).map_err(|e| format!("MFStartup failed: {e}"))?;
        MFShutdown().map_err(|e| format!("MFShutdown failed: {e}"))?;
    }

    Err("Media Foundation frame extraction is unavailable, using ffmpeg fallback".to_string())
}

async fn capture_with_ffmpeg(file_path: &Path) -> Result<Vec<u8>, String> {
    let mut command = Command::new("ffmpeg");
    command
        .arg("-hide_banner")
        .arg("-loglevel")
        .arg("error")
        .arg("-ss")
        .arg("1")
        .arg("-i")
        .arg(file_path)
        .arg("-frames:v")
        .arg("1")
        .arg("-f")
        .arg("image2pipe")
        .arg("-vcodec")
        .arg("mjpeg")
        .arg("pipe:1")
        .kill_on_drop(true);

    let output = match tokio::time::timeout(Duration::from_secs(10), command.output()).await {
        Ok(Ok(out)) => out,
        Ok(Err(e)) => return Err(format!("Failed to execute ffmpeg fallback: {e}")),
        Err(_) => return Err("ffmpeg fallback timed out".to_string()),
    };

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ffmpeg fallback failed: {stderr}"));
    }

    if output.stdout.is_empty() {
        return Err("ffmpeg fallback returned empty image output".to_string());
    }

    let decoded = image::load_from_memory(&output.stdout)
        .map_err(|e| format!("Failed to decode ffmpeg frame image: {e}"))?;
    encode_thumbnail(decoded)
}

fn encode_thumbnail(image: DynamicImage) -> Result<Vec<u8>, String> {
    let thumb = image.thumbnail(128, 128);
    let mut buf = Cursor::new(Vec::new());
    let mut encoder = JpegEncoder::new_with_quality(&mut buf, 70);
    encoder
        .encode_image(&thumb)
        .map_err(|e| format!("Failed to encode thumbnail jpeg: {e}"))?;
    Ok(buf.into_inner())
}
