use image::codecs::jpeg::JpegEncoder;
use image::DynamicImage;
use objc::runtime::{Object, YES};
use objc::{class, msg_send, sel, sel_impl};
use std::io::Cursor;
use std::path::Path;
use std::process::Command;

#[link(name = "AVFoundation", kind = "framework")]
unsafe extern "C" {}
#[link(name = "Foundation", kind = "framework")]
unsafe extern "C" {}
#[link(name = "CoreMedia", kind = "framework")]
unsafe extern "C" {}
#[link(name = "AppKit", kind = "framework")]
unsafe extern "C" {}

#[repr(C)]
#[derive(Clone, Copy)]
struct CMTime {
    value: i64,
    timescale: i32,
    flags: u32,
    epoch: i64,
}

unsafe extern "C" {
    fn CMTimeMake(value: i64, timescale: i32) -> CMTime;
}

/// # Description
/// Attempts to capture the first second frame of a video using AVFoundation on macOS.
/// If that fails, it falls back to using ffmpeg as a backup method.
/// # Errors
/// Returns an error string if both AVFoundation and ffmpeg methods fail.
pub fn capture_first_second_frame_jpeg(file_path: &Path) -> Result<Vec<u8>, String> {
    attempt_avfoundation(file_path).or_else(|av_err| {
        tracing::warn!(
            path = %file_path.display(),
            error = %av_err,
            "avfoundation thumbnail failed, falling back to ffmpeg"
        );
        capture_with_ffmpeg(file_path)
    })
}

fn attempt_avfoundation(file_path: &Path) -> Result<Vec<u8>, String> {
    let path_string = file_path.to_string_lossy().to_string();
    let path_bytes = path_string.as_bytes();

    unsafe {
        let ns_string: *mut Object = msg_send![class!(NSString), alloc];
        let ns_string: *mut Object = msg_send![
            ns_string,
            initWithBytes: path_bytes.as_ptr()
            length: path_bytes.len()
            encoding: 4usize
        ];

        if ns_string.is_null() {
            return Err("Failed to create NSString for path".to_string());
        }

        let url: *mut Object = msg_send![class!(NSURL), fileURLWithPath: ns_string];
        if url.is_null() {
            return Err("Failed to create NSURL from path".to_string());
        }

        let asset: *mut Object =
            msg_send![class!(AVURLAsset), URLAssetWithURL: url options: std::ptr::null::<Object>()];
        if asset.is_null() {
            return Err("Failed to create AVURLAsset".to_string());
        }

        let generator: *mut Object =
            msg_send![class!(AVAssetImageGenerator), assetImageGeneratorWithAsset: asset];
        if generator.is_null() {
            return Err("Failed to create AVAssetImageGenerator".to_string());
        }

        let _: () = msg_send![generator, setAppliesPreferredTrackTransform: YES];

        let time = CMTimeMake(1, 1);
        let mut actual_time = CMTime {
            value: 0,
            timescale: 0,
            flags: 0,
            epoch: 0,
        };
        let mut error: *mut Object = std::ptr::null_mut();

        let cg_image: *mut std::ffi::c_void = msg_send![
            generator,
            copyCGImageAtTime: time
            actualTime: &mut actual_time
            error: &mut error
        ];

        if cg_image.is_null() {
            if !error.is_null() {
                let desc: *mut Object = msg_send![error, localizedDescription];
                if !desc.is_null() {
                    let cstr: *const std::os::raw::c_char = msg_send![desc, UTF8String];
                    if !cstr.is_null() {
                        let err = std::ffi::CStr::from_ptr(cstr).to_string_lossy().to_string();
                        return Err(format!("AVFoundation copyCGImageAtTime failed: {err}"));
                    }
                }
            }
            return Err("AVFoundation failed to extract CGImage".to_string());
        }

        let image_rep: *mut Object = msg_send![class!(NSBitmapImageRep), alloc];
        let image_rep: *mut Object = msg_send![image_rep, initWithCGImage: cg_image];
        if image_rep.is_null() {
            return Err("Failed to create NSBitmapImageRep".to_string());
        }

        let properties: *mut Object = msg_send![class!(NSDictionary), dictionary];
        let data: *mut Object = msg_send![
            image_rep,
            representationUsingType: 3usize
            properties: properties
        ];

        if data.is_null() {
            return Err("Failed to convert AVFoundation image to NSData".to_string());
        }

        let bytes: *const u8 = msg_send![data, bytes];
        let len: usize = msg_send![data, length];

        if bytes.is_null() || len == 0 {
            return Err("AVFoundation produced empty image data".to_string());
        }

        let raw = std::slice::from_raw_parts(bytes, len).to_vec();
        let decoded = image::load_from_memory(&raw)
            .map_err(|e| format!("Failed to decode AVFoundation image data: {e}"))?;
        encode_thumbnail(decoded)
    }
}

fn capture_with_ffmpeg(file_path: &Path) -> Result<Vec<u8>, String> {
    let output = Command::new("ffmpeg")
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
        .output()
        .map_err(|e| format!("Failed to execute ffmpeg fallback: {e}"))?;

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
