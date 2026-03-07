use std::path::Path;

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "windows")]
mod windows;

pub async fn capture_first_second_frame_jpeg(file_path: &Path) -> Result<Vec<u8>, String> {
    #[cfg(target_os = "windows")]
    {
        return windows::capture_first_second_frame_jpeg(file_path).await;
    }

    #[cfg(target_os = "macos")]
    {
        return macos::capture_first_second_frame_jpeg(file_path).await;
    }

    #[cfg(target_os = "linux")]
    {
        return linux::capture_first_second_frame_jpeg(file_path).await;
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        let _ = file_path;
        Err("Video thumbnail is not supported on this platform".to_string())
    }
}
