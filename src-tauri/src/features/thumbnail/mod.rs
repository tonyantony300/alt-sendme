mod image;
mod mime;
mod video;

use std::path::Path;

pub fn generate_thumbnail(path: &Path) -> Option<String> {
    match mime::detect_media_kind(path) {
        mime::MediaKind::Image => image::generate_image_thumbnail(path),
        mime::MediaKind::Video => video::generate_video_thumbnail(path),
        mime::MediaKind::Other => None,
    }
}
