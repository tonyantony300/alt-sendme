use image::codecs::jpeg::JpegEncoder;
use image::DynamicImage;
use std::io::Cursor;
use std::path::Path;
use tokio::process::Command;
use tokio::time::Duration;

#[cfg(feature = "linux-gstreamer")]
use gstreamer as gst;
#[cfg(feature = "linux-gstreamer")]
use gstreamer::prelude::*;
#[cfg(feature = "linux-gstreamer")]
use gstreamer_app as gst_app;
#[cfg(feature = "linux-gstreamer")]
use gstreamer_video as gst_video;
#[cfg(feature = "linux-gstreamer")]
use image::RgbImage;

/// # Description
/// Captures the first second frame of a video file and encodes it as a JPEG image.
/// For linux, if gstreamer fails, it falls back to ffmpeg
/// # Returns
/// `Ok(Vec<u8>)` containing the JPEG-encoded thumbnail bytes if successful,
/// or `Err(String)` with an error message if the file is not a valid video
/// or an error occurs during processing.
pub async fn capture_first_second_frame_jpeg(file_path: &Path) -> Result<Vec<u8>, String> {
    #[cfg(feature = "linux-gstreamer")]
    {
        let path_buf = file_path.to_path_buf();
        let gst_result = tokio::task::spawn_blocking(move || capture_with_gstreamer(&path_buf))
            .await
            .map_err(|e| format!("Task join error: {e}"))
            .and_then(|res| res);

        match gst_result {
            Ok(bytes) => return Ok(bytes),
            Err(gstreamer_err) => {
                tracing::warn!(
                    path = %file_path.display(),
                    error = %gstreamer_err,
                    "gstreamer thumbnail failed, falling back to ffmpeg"
                );
            }
        }
    }

    capture_with_ffmpeg(file_path).await
}

#[cfg(feature = "linux-gstreamer")]
fn capture_with_gstreamer(file_path: &Path) -> Result<Vec<u8>, String> {
    gst::init().map_err(|e| format!("Failed to initialize gstreamer: {e}"))?;

    // turn file path into uri and escape special characters
    let uri = gst::Uri::from_file_path(file_path)
        .map_err(|_| format!("Invalid video path: {}", file_path.display()))?;

    // Description of gstreamer pipeline:
    // - uridecodebin: takes a URI and decodes it,
    //handling various video formats and demuxing as needed.
    // - videoconvert: converts the video into a raw format (RGB in this case)
    // - videoscale: scales the video frames
    // (not strictly needed here since we only capture one frame, but can help with certain formats)
    // - video/x-raw,format=RGB: ensures the video is in raw RGB format for easier processing
    // - appsink: allows us to pull the video frame data into our application for encoding
    let pipeline_description = format!(
        "uridecodebin uri=\"{}\" name=src \
		 ! videoconvert \
		 ! videoscale \
		 ! video/x-raw,format=RGB \
		 ! appsink name=sink emit-signals=false sync=false max-buffers=1 drop=true",
        uri.as_str()
    );

    // Build the gstreamer pipeline
    let pipeline = gst::parse::launch(&pipeline_description)
        .map_err(|e| format!("Failed to build gstreamer pipeline: {e}"))?
        .downcast::<gst::Pipeline>()
        .map_err(|_| "Failed to downcast gstreamer pipeline".to_string())?;

    // Get the appsink element from the pipeline to pull video frames later
    let appsink = pipeline
        .by_name("sink")
        .ok_or_else(|| "Failed to find appsink in pipeline".to_string())?
        .downcast::<gst_app::AppSink>()
        .map_err(|_| "Failed to downcast appsink".to_string())?;

    let bus = pipeline
        .bus()
        .ok_or_else(|| "Failed to get gstreamer bus".to_string())?;

    // Start the pipeline
    let result = (|| -> Result<Vec<u8>, String> {
        // Set pipeline to paused state to allow it to preroll and decode the first frame
        pipeline
            .set_state(gst::State::Paused)
            .map_err(|e| format!("Failed to set pipeline to paused: {e:?}"))?;

        wait_for_pipeline_ready(&bus)?;

        // Seek to the 1 second mark to capture a frame
        // Here seek to the key unit around 1 second
        pipeline
            .seek_simple(
                gst::SeekFlags::FLUSH | gst::SeekFlags::KEY_UNIT,
                gst::ClockTime::from_seconds(1),
            )
            .map_err(|e| format!("Failed to seek video to 1s: {e}"))?;

        pipeline
            .set_state(gst::State::Playing)
            .map_err(|e| format!("Failed to set pipeline to playing: {e:?}"))?;

        // Pull the decoded video frame sample from the appsink
        let sample = appsink
            .try_pull_sample(gst::ClockTime::from_seconds(5))
            .ok_or_else(|| "Timed out while pulling video frame sample".to_string())?;

        // Encode the video frame sample as a JPEG thumbnail and return the bytes
        sample_to_thumbnail_jpeg(&sample)
    })();

    let _ = pipeline.set_state(gst::State::Null);
    result
}

#[cfg(feature = "linux-gstreamer")]
fn wait_for_pipeline_ready(bus: &gst::Bus) -> Result<(), String> {
    let message = bus.timed_pop_filtered(
        gst::ClockTime::from_seconds(10),
        &[gst::MessageType::AsyncDone, gst::MessageType::Error],
    );

    match message {
        Some(msg) if msg.type_() == gst::MessageType::AsyncDone => Ok(()),
        Some(msg) if msg.type_() == gst::MessageType::Error => {
            let error = match msg.view() {
                gst::MessageView::Error(err) => err.error().to_string(),
                _ => "Unknown gstreamer error".to_string(),
            };
            Err(format!("Gstreamer pipeline error: {error}"))
        }
        _ => Err("Timed out waiting for gstreamer pipeline readiness".to_string()),
    }
}

#[cfg(feature = "linux-gstreamer")]
fn sample_to_thumbnail_jpeg(sample: &gst::Sample) -> Result<Vec<u8>, String> {
    let caps = sample
        .caps()
        .ok_or_else(|| "Missing sample caps".to_string())?;

    let info = gst_video::VideoInfo::from_caps(caps.as_ref())
        .map_err(|e| format!("Failed to parse video info from caps: {e}"))?;
    let width = info.width() as usize;
    let height = info.height() as usize;
    if width == 0 || height == 0 {
        return Err("Invalid frame dimensions in caps".to_string());
    }

    // Map the sample as a video frame and copy row-by-row to handle stride padding.
    let buffer = sample
        .buffer()
        .ok_or_else(|| "Missing sample buffer".to_string())?;

    let frame = gst_video::VideoFrameRef::from_buffer_ref_readable(buffer, &info)
        .map_err(|e| format!("Failed to map sample buffer as video frame: {e}"))?;
    let plane = frame
        .plane_data(0)
        .map_err(|e| format!("Failed to access RGB plane data: {e}"))?;

    let stride = buffer
        .meta::<gst_video::VideoMeta>()
        .map(|meta| meta.stride()[0])
        .unwrap_or_else(|| info.stride()[0]);
    if stride <= 0 {
        return Err(format!("Invalid non-positive frame stride: {stride}"));
    }

    let stride = stride as usize;
    let row_bytes = width
        .checked_mul(3)
        .ok_or_else(|| "RGB row size overflow".to_string())?;
    if stride < row_bytes {
        return Err(format!(
            "Frame stride {stride} is smaller than required RGB row size {row_bytes}"
        ));
    }

    let required_len = stride
        .checked_mul(height)
        .ok_or_else(|| "Frame size overflow".to_string())?;
    if plane.len() < required_len {
        return Err(format!(
            "Insufficient frame data: got {} bytes, need at least {required_len}",
            plane.len()
        ));
    }

    let mut packed = Vec::with_capacity(row_bytes * height);
    for row in 0..height {
        let start = row * stride;
        let end = start + row_bytes;
        packed.extend_from_slice(&plane[start..end]);
    }

    let rgb = RgbImage::from_raw(width as u32, height as u32, packed)
        .ok_or_else(|| "Failed to convert frame to RGB image".to_string())?;

    encode_thumbnail(DynamicImage::ImageRgb8(rgb))
}

async fn capture_with_ffmpeg(file_path: &Path) -> Result<Vec<u8>, String> {
    let mut errors = Vec::new();

    // Try multiple seek points to increase chances of
    // getting a valid frame
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

async fn capture_with_ffmpeg_seek(
    file_path: &Path,
    seek_seconds: &str,
) -> Result<DynamicImage, String> {
    let mut command = Command::new("ffmpeg");
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

    // Run ffmpeg command with a timeout to avoid hanging on problematic files
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

    image::load_from_memory(&output.stdout)
        .map_err(|e| format!("Failed to decode ffmpeg frame image: {e}"))
}

fn encode_thumbnail(image: DynamicImage) -> Result<Vec<u8>, String> {
    // Resize the image
    let thumb = image.thumbnail(128, 128);
    let mut buf = Cursor::new(Vec::new());
    let mut encoder = JpegEncoder::new_with_quality(&mut buf, 70);

    // Encode the thumbnail image as JPEG and return the bytes
    encoder
        .encode_image(&thumb)
        .map_err(|e| format!("Failed to encode thumbnail jpeg: {e}"))?;
    Ok(buf.into_inner())
}
