use core_foundation::base::CFRelease;
use core_graphics::sys::CGImageRef;
use image::codecs::jpeg::JpegEncoder;
use image::DynamicImage;
use objc::rc::autoreleasepool;
use objc::runtime::{Object, YES};
use objc::{class, msg_send, sel, sel_impl};
use std::ffi::c_void;
use std::io::Cursor;
use std::path::Path;
use tokio::process::Command;
use tokio::time::Duration;

#[link(name = "AVFoundation", kind = "framework")]
unsafe extern "C" {}
#[link(name = "Foundation", kind = "framework")]
unsafe extern "C" {}
#[link(name = "CoreMedia", kind = "framework")]
unsafe extern "C" {}
#[link(name = "CoreGraphics", kind = "framework")]
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

const NS_UTF8_STRING_ENCODING: usize = 4;
const NS_BITMAP_IMAGE_FILE_TYPE_JPEG: usize = 3;

struct ObjcOwned {
    ptr: *mut Object,
}

impl ObjcOwned {
    fn new() -> Self {
        Self {
            ptr: std::ptr::null_mut(),
        }
    }

    fn set(&mut self, ptr: *mut Object) {
        self.ptr = ptr;
    }
}

impl Drop for ObjcOwned {
    fn drop(&mut self) {
        if !self.ptr.is_null() {
            unsafe {
                let _: () = msg_send![self.ptr, release];
            }
        }
    }
}

struct CgImageOwned {
    ptr: CGImageRef,
}

impl CgImageOwned {
    fn new() -> Self {
        Self {
            ptr: std::ptr::null_mut(),
        }
    }

    fn set(&mut self, ptr: CGImageRef) {
        self.ptr = ptr;
    }
}

impl Drop for CgImageOwned {
    fn drop(&mut self) {
        if !self.ptr.is_null() {
            unsafe {
                CFRelease(self.ptr as *const c_void);
            }
        }
    }
}

unsafe extern "C" {
    fn CMTimeMake(value: i64, timescale: i32) -> CMTime;
}

/// # Description
/// Attempts to capture the first second frame of a video using AVFoundation on macOS.
/// If that fails, it falls back to using ffmpeg as a backup method.
/// # Errors
/// Returns an error string if both AVFoundation and ffmpeg methods fail.
pub async fn capture_first_second_frame_jpeg(file_path: &Path) -> Result<Vec<u8>, String> {
    let path_buf = file_path.to_path_buf();
    let av_result = tokio::task::spawn_blocking(move || attempt_avfoundation(&path_buf))
        .await
        .map_err(|e| format!("Task join error: {e}"))
        .and_then(|res| res);

    match av_result {
        Ok(bytes) => Ok(bytes),
        Err(av_err) => {
            tracing::warn!(
                path = %file_path.display(),
                error = %av_err,
                "avfoundation thumbnail failed, falling back to ffmpeg"
            );
            capture_with_ffmpeg(file_path).await
        }
    }
}

fn attempt_avfoundation(file_path: &Path) -> Result<Vec<u8>, String> {
    let path_string = file_path.to_string_lossy().to_string();
    let path_bytes = path_string.as_bytes();

    autoreleasepool(|| unsafe {
        let mut ns_string = ObjcOwned::new();
        let mut cg_image = CgImageOwned::new();
        let mut image_rep = ObjcOwned::new();

        let result = (|| -> Result<DynamicImage, String> {
            let ns_string_alloc: *mut Object = msg_send![class!(NSString), alloc];
            let ns_string_ptr: *mut Object = msg_send![
                ns_string_alloc,
                initWithBytes: path_bytes.as_ptr()
                length: path_bytes.len()
                encoding: NS_UTF8_STRING_ENCODING
            ];
            ns_string.set(ns_string_ptr);

            if ns_string_ptr.is_null() {
                return Err("Failed to create NSString for path".to_string());
            }

            let url: *mut Object = msg_send![class!(NSURL), fileURLWithPath: ns_string_ptr];
            if url.is_null() {
                return Err("Failed to create NSURL from path".to_string());
            }

            let asset: *mut Object = msg_send![class!(AVURLAsset), URLAssetWithURL: url options: std::ptr::null::<Object>()];
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

            let cg_image_ptr: CGImageRef = msg_send![
                generator,
                copyCGImageAtTime: time
                actualTime: &mut actual_time
                error: &mut error
            ];
            cg_image.set(cg_image_ptr);

            if cg_image_ptr.is_null() {
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

            let image_rep_alloc: *mut Object = msg_send![class!(NSBitmapImageRep), alloc];
            let image_rep_ptr: *mut Object =
                msg_send![image_rep_alloc, initWithCGImage: cg_image_ptr];
            image_rep.set(image_rep_ptr);
            // After handing the CGImage to NSBitmapImageRep, clear our local owner to avoid
            // releasing the same CGImage twice (NSBitmapImageRep may retain/release it).
            cg_image.set(std::ptr::null_mut());
            if image_rep_ptr.is_null() {
                return Err("Failed to create NSBitmapImageRep".to_string());
            }

            let properties: *mut Object = msg_send![class!(NSDictionary), dictionary];
            let data: *mut Object = msg_send![
                image_rep_ptr,
                representationUsingType: NS_BITMAP_IMAGE_FILE_TYPE_JPEG
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
            image::load_from_memory(&raw)
                .map_err(|e| format!("Failed to decode AVFoundation image data: {e}"))
        })();

        result.and_then(encode_thumbnail)
    })
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
