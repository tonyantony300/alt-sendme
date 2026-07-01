use std::path::Path;

pub enum MediaKind {
    Image,
    Video,
    Other,
}

pub fn detect_media_kind(path: &Path) -> MediaKind {
    if !path.is_file() {
        return MediaKind::Other;
    }

    let mime = mime_guess::from_path(path).first_or_octet_stream();
    match mime.type_().as_str() {
        "image" => MediaKind::Image,
        "video" => MediaKind::Video,
        _ => MediaKind::Other,
    }
}
