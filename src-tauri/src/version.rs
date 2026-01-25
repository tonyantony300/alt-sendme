pub fn get_app_version() -> String {
    // APP_VERSION is set at compile time by build.rs from package.json
    // Using env!() macro to read compile-time environment variable
    env!("APP_VERSION").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_format() {
        let version = get_app_version();

        // Ensure version follows semver format (basic check)
        assert!(!version.is_empty());
        assert!(version
            .chars()
            .all(|c| c.is_alphanumeric() || c == '.' || c == '-'));
    }
}
