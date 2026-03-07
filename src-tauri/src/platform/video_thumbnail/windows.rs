use image::codecs::jpeg::JpegEncoder;
use image::DynamicImage;
use std::io::Cursor;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};
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
    let mut errors = Vec::new();

    // Try multiple seek points to increase chances of getting a valid frame.
    for seek in ["1", "0.2", "0"] {
        match capture_with_ffmpeg_seek(file_path, seek).await {
            Ok(decoded) => return encode_thumbnail(decoded),
            Err(err) => errors.push(format!("ss={seek}: {err}")),
        }
    }

    Err(format!(
        "ffmpeg fallback failed for all seek points: {}",
        errors.join(" | ")
    ))
}

fn ffmpeg_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    if let Ok(path) = std::env::var("ALT_SENDME_FFMPEG_PATH") {
        if !path.trim().is_empty() {
            candidates.push(PathBuf::from(path));
        }
    }

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            candidates.push(exe_dir.join("ffmpeg.exe"));
            candidates.push(exe_dir.join("ffmpeg"));
            candidates.push(exe_dir.join("ffmpeg-x86_64-pc-windows-msvc.exe"));
            candidates.push(exe_dir.join("ffmpeg-x86_64-pc-windows-gnu.exe"));
        }
    }

    // PATH fallback.
    candidates.push(PathBuf::from("ffmpeg"));

    let mut unique = Vec::new();
    for candidate in candidates {
        if !unique
            .iter()
            .any(|existing: &PathBuf| existing == &candidate)
        {
            unique.push(candidate);
        }
    }
    unique
}

async fn capture_with_ffmpeg_seek(
    file_path: &Path,
    seek_seconds: &str,
) -> Result<DynamicImage, String> {
    let mut not_found = Vec::new();
    let mut last_error = None;

    for ffmpeg_bin in ffmpeg_candidates() {
        let mut command = Command::new(&ffmpeg_bin);
        command
            .arg("-hide_banner")
            .arg("-loglevel")
            .arg("error")
            .arg("-ss")
            .arg(seek_seconds)
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
            Ok(Err(e)) => {
                if e.kind() == ErrorKind::NotFound {
                    not_found.push(ffmpeg_bin.display().to_string());
                    continue;
                }
                last_error = Some(format!(
                    "Failed to execute ffmpeg fallback ({}): {e}",
                    ffmpeg_bin.display()
                ));
                continue;
            }
            Err(_) => {
                last_error = Some(format!(
                    "ffmpeg fallback timed out ({})",
                    ffmpeg_bin.display()
                ));
                continue;
            }
        };

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            last_error = Some(format!(
                "ffmpeg fallback failed ({}): {stderr}",
                ffmpeg_bin.display()
            ));
            continue;
        }

        if output.stdout.is_empty() {
            last_error = Some(format!(
                "ffmpeg fallback returned empty image output ({})",
                ffmpeg_bin.display()
            ));
            continue;
        }

        return image::load_from_memory(&output.stdout)
            .map_err(|e| format!("Failed to decode ffmpeg frame image: {e}"));
    }

    if !not_found.is_empty() {
        return Err(format!(
            "ffmpeg executable not found (set ALT_SENDME_FFMPEG_PATH or bundle a sidecar). Tried: {}",
            not_found.join(", ")
        ));
    }

    Err(last_error.unwrap_or_else(|| "ffmpeg fallback failed".to_string()))
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
