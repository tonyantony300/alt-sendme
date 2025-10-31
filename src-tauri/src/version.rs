/// Application version, set at compile time from package.json
pub const VERSION: &str = env!("APP_VERSION");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_format() {
        // Ensure version follows semver format (basic check)
        assert!(!VERSION.is_empty());
        assert!(VERSION.chars().all(|c| c.is_alphanumeric() || c == '.' || c == '-'));
    }
}

