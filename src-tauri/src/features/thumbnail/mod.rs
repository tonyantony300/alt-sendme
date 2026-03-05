mod image;
mod mime;
mod video;

use std::path::Path;

pub async fn generate_thumbnail(path: &Path) -> Option<String> {
    match mime::detect_media_kind(path) {
        mime::MediaKind::Image => {
            let path_buf = path.to_path_buf();
            tokio::task::spawn_blocking(move || image::generate_image_thumbnail(&path_buf))
                .await
                .ok()
                .flatten()
        }
        mime::MediaKind::Video => video::generate_video_thumbnail(path).await,
        mime::MediaKind::Other => None,
    }
}
