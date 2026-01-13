use std::env;
use std::fs;
use std::path::PathBuf;

pub fn get_app_version() -> String {
    let manifest_dir =
        env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR should be set by Cargo");

    let package_json_path = PathBuf::from(manifest_dir).join("../package.json");

    if package_json_path.exists() {
        let package_json_str =
            fs::read_to_string(&package_json_path).expect("Failed to read package.json");
        let package_json: serde_json::Value =
            serde_json::from_str(&package_json_str).expect("Failed to parse package.json");

        let version = match package_json.get("version") {
            Some(v) => v.as_str().unwrap_or("").to_string(),
            None => panic!(""),
        };

        return version;
    } else {
        // Panic when the version field has not been set.
        // Might fallback to Cargo.toml version in the future if package.json doesn't exist
        // This should rarely happen, but provides a safety net
        panic!(
            "Error: application version not found in package.json. Please set the `version` field."
        );
    }
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
