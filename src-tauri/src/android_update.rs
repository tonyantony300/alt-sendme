//! Update checking for sideloaded Android builds.
//!
//! The desktop updater plugin is `#[cfg(desktop)]` — it cannot install an APK,
//! and a Play-distributed app may not update itself at all. So Android only
//! *reports* a newer release and hands the user off to the release page.
//!
//! The manifest is the same `latest.json` the desktop updater reads
//! (`tauri.conf.json` → `plugins.updater.endpoints`), so one release publishes
//! one version number for every target.

use serde::{Deserialize, Serialize};

/// Release page for a version, which is where the APKs are attached.
const RELEASE_TAG_URL: &str = "https://github.com/tonyantony300/dashbeam/releases/tag/v";

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AndroidUpdate {
    pub version: String,
    pub notes: String,
    /// Release page rather than a direct APK link: the user picks their ABI,
    /// and the app must not hand an installer to the system itself.
    pub url: String,
}

#[derive(Deserialize)]
struct LatestManifest {
    version: String,
    #[serde(default)]
    notes: String,
}

/// Semver-ish precedence. Numeric components compare as numbers (so 0.10 beats
/// 0.9), missing components are zero, and a pre-release sorts *below* the
/// release it precedes. Build metadata is ignored, per semver.
fn precedence(version: &str) -> (Vec<u64>, bool) {
    let trimmed = version.trim().trim_start_matches('v');
    let without_build = trimmed.split('+').next().unwrap_or("");
    let (core, pre) = match without_build.split_once('-') {
        Some((core, pre)) => (core, !pre.is_empty()),
        None => (without_build, false),
    };
    let numbers = core
        .split('.')
        .map(|part| part.parse::<u64>().unwrap_or(0))
        .collect();
    (numbers, pre)
}

/// Unparseable input yields zeros, so a malformed manifest reads as "not newer"
/// rather than nagging every launch.
pub fn is_newer(latest: &str, current: &str) -> bool {
    let (latest_nums, latest_pre) = precedence(latest);
    let (current_nums, current_pre) = precedence(current);

    for index in 0..latest_nums.len().max(current_nums.len()) {
        let l = latest_nums.get(index).copied().unwrap_or(0);
        let c = current_nums.get(index).copied().unwrap_or(0);
        if l != c {
            return l > c;
        }
    }

    // Same core: only a full release outranks a pre-release. Two pre-releases
    // of one version are not worth ordering.
    current_pre && !latest_pre
}

/// `None` when the manifest is not ahead of `current_version`.
pub fn parse_manifest(body: &str, current_version: &str) -> Result<Option<AndroidUpdate>, String> {
    let manifest: LatestManifest =
        serde_json::from_str(body).map_err(|e| format!("Malformed update manifest: {e}"))?;

    if !is_newer(&manifest.version, current_version) {
        return Ok(None);
    }

    Ok(Some(AndroidUpdate {
        url: format!("{RELEASE_TAG_URL}{}", manifest.version),
        version: manifest.version,
        notes: manifest.notes,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn patch_and_minor_bumps_are_newer() {
        assert!(is_newer("0.7.1", "0.7.0"));
        assert!(is_newer("0.8.0", "0.7.9"));
        assert!(is_newer("1.0.0", "0.99.99"));
    }

    #[test]
    fn same_version_is_not_newer() {
        assert!(!is_newer("0.7.0", "0.7.0"));
    }

    #[test]
    fn older_release_is_not_newer() {
        assert!(!is_newer("0.6.2", "0.7.0"));
    }

    #[test]
    fn components_compare_numerically_not_lexically() {
        assert!(is_newer("0.10.0", "0.9.0"));
        assert!(!is_newer("0.9.0", "0.10.0"));
    }

    #[test]
    fn a_leading_v_is_tolerated() {
        assert!(is_newer("v0.7.1", "0.7.0"));
        assert!(!is_newer("v0.7.0", "0.7.0"));
    }

    #[test]
    fn missing_components_read_as_zero() {
        assert!(is_newer("0.8", "0.7.4"));
        assert!(!is_newer("0.7", "0.7.0"));
    }

    #[test]
    fn a_prerelease_ranks_below_its_release() {
        assert!(!is_newer("0.8.0-rc.1", "0.8.0"));
        assert!(is_newer("0.8.0", "0.8.0-rc.1"));
        assert!(is_newer("0.8.0-rc.1", "0.7.0"));
    }

    #[test]
    fn build_metadata_does_not_affect_precedence() {
        assert!(!is_newer("0.7.0+build.9", "0.7.0"));
    }

    #[test]
    fn garbage_versions_never_prompt() {
        assert!(!is_newer("not-a-version", "0.7.0"));
        assert!(!is_newer("", "0.7.0"));
    }

    #[test]
    fn parse_manifest_reports_a_newer_release() {
        let update = parse_manifest(r#"{"version":"0.8.0","notes":"fixes"}"#, "0.7.0")
            .expect("valid manifest")
            .expect("update available");
        assert_eq!(update.version, "0.8.0");
        assert_eq!(update.notes, "fixes");
        assert_eq!(
            update.url,
            "https://github.com/tonyantony300/dashbeam/releases/tag/v0.8.0"
        );
    }

    #[test]
    fn parse_manifest_is_quiet_when_current() {
        assert_eq!(
            parse_manifest(r#"{"version":"0.7.0"}"#, "0.7.0").expect("valid manifest"),
            None
        );
    }

    #[test]
    fn parse_manifest_rejects_non_json() {
        assert!(parse_manifest("<html>404</html>", "0.7.0").is_err());
    }
}
