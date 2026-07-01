use base64::{engine::general_purpose, Engine as _};
use image::codecs::jpeg::JpegEncoder;
use std::io::Cursor;
use std::path::Path;

/// # Returns
/// `Some(String)` containing the base64-encoded thumbnail if successful,
/// or `None` if the file is not a valid image or an error occurs during processing.
pub fn generate_image_thumbnail(file_path: &Path) -> Option<String> {
    if !file_path.is_file() {
        return None;
    }

    if let Ok(img) = image::open(file_path) {
        let thumb = img.thumbnail(128, 128);
        let mut buf = Cursor::new(Vec::new());
        let mut encoder = JpegEncoder::new_with_quality(&mut buf, 70);
        encoder.encode_image(&thumb).ok()?;
        Some(general_purpose::STANDARD.encode(buf.into_inner()))
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{Rgb, RgbImage};
    use std::env;
    use std::fs;

    #[test]
    fn test_generate_image_thumbnail() {
        // Create a temporary image file
        let mut img = RgbImage::new(100, 100);
        for x in 0..100 {
            for y in 0..100 {
                img.put_pixel(x, y, Rgb([255, 0, 0]));
            }
        }
        let temp_dir = env::temp_dir();
        // Use unique name to avoid flaky parallel tests
        let unique = format!(
            "test_thumb_feat-{}-{}.png",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos()
        );
        let file_path = temp_dir.join(unique);
        img.save(&file_path).unwrap();

        // Generate thumbnail
        let result = generate_image_thumbnail(&file_path);

        assert!(
            result.is_some(),
            "Thumbnail generation should succeed for a valid image"
        );
        let b64 = result.unwrap();
        assert!(!b64.is_empty(), "Base64 string should not be empty");

        assert!(
            base64::engine::general_purpose::STANDARD
                .decode(&b64)
                .is_ok(),
            "Base64 string should be decodable"
        );

        // Clean up
        let _ = fs::remove_file(file_path);
    }

    #[test]
    fn test_generate_image_thumbnail_invalid_format() {
        let temp_dir = env::temp_dir();
        // Use unique filename
        let unique = format!(
            "test_invalid-{}-{}.txt",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos()
        );
        let file_path = temp_dir.join(unique);
        fs::write(&file_path, "This is not an image file").unwrap();

        let result = generate_image_thumbnail(&file_path);
        assert!(
            result.is_none(),
            "Should return None for invalid image file"
        );

        // Clean up
        let _ = fs::remove_file(file_path);
    }

    #[test]
    fn test_generate_image_thumbnail_nonexistent_file() {
        let result = generate_image_thumbnail(Path::new("/path/that/does/not/exist.png"));
        assert!(
            result.is_none(),
            "Should return None for non-existent files"
        );
    }
}
