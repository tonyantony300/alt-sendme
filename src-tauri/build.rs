use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    // Read version from package.json (single source of truth)
    // build.rs is in src-tauri/, so package.json is in the same directory
    let manifest_dir = env::var("CARGO_MANIFEST_DIR")
        .expect("CARGO_MANIFEST_DIR should be set by Cargo");
    let package_json_path = PathBuf::from(manifest_dir).join("package.json");
    
    if package_json_path.exists() {
        let package_json_str = fs::read_to_string(&package_json_path)
            .expect("Failed to read package.json");
        let package_json: serde_json::Value = serde_json::from_str(&package_json_str)
            .expect("Failed to parse package.json");
        
        if let Some(version) = package_json.get("version").and_then(|v| v.as_str()) {
            println!("cargo:rustc-env=APP_VERSION={}", version);
            println!("cargo:rerun-if-changed=package.json");
        }
    } else {
        // Fallback to Cargo.toml version if package.json doesn't exist
        // This should rarely happen, but provides a safety net
        eprintln!("Warning: package.json not found, using Cargo.toml version");
    }
    
    tauri_build::build()
}
