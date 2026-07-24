use serde::{Deserialize, Serialize};

/// Public device metadata persisted on disk (no secret key).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceMetaFile {
    pub version: u32,
    pub endpoint_id: String,
    pub display_name: String,
    /// Form factor: `laptop` | `desktop` | `phone` | `tablet` | `unknown`.
    pub device_type: String,
    /// OS family: `macos` | `windows` | `linux` | `ios` | `android` | …
    #[serde(default)]
    pub os: String,
    pub created_at: u64,
    /// True once the user has set a custom display name.
    #[serde(default)]
    pub name_is_custom: bool,
}

impl DeviceMetaFile {
    pub const VERSION: u32 = 2;
    pub const MAX_DISPLAY_NAME_CHARS: usize = 64;

    pub fn new(endpoint_id: String, display_name: String, device_type: String) -> Self {
        Self {
            version: Self::VERSION,
            endpoint_id,
            display_name,
            device_type,
            os: detect_os(),
            created_at: unix_now_ms(),
            name_is_custom: false,
        }
    }

    /// Fill missing fields on older `device.json` files.
    pub fn migrate(&mut self) {
        if self.os.trim().is_empty() {
            self.os = detect_os();
        }
        if self.device_type.trim().is_empty() {
            self.device_type = default_device_type();
        }
        if self.version < Self::VERSION {
            self.version = Self::VERSION;
        }
    }
}

/// Pairing relationship status for a stored remote device.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "kebab-case")]
pub enum PairingStatus {
    #[default]
    Active,
    UnpairedRemotely,
    /// Local endpoint identity changed; peers still have the previous endpoint id.
    StaleLocalIdentity,
}

impl PairingStatus {
    pub fn is_active(self) -> bool {
        matches!(self, Self::Active)
    }

    /// Devices that should keep outbound presence loops and allowlist entries.
    pub fn is_connectable(self) -> bool {
        matches!(self, Self::Active | Self::StaleLocalIdentity)
    }
}

/// Paired remote device record (persisted).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PairedDevice {
    pub endpoint_id: String,
    pub display_name: String,
    pub device_type: String,
    #[serde(default)]
    pub os: String,
    pub paired_at: u64,
    pub last_seen_at: u64,
    /// Relay URL last known for this peer (from pairing ticket or discovery).
    #[serde(default)]
    pub relay_url: Option<String>,
    #[serde(default)]
    pub pairing_status: PairingStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PairedDeviceList {
    pub devices: Vec<PairedDevice>,
}

pub fn unix_now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

pub fn detect_os() -> String {
    match std::env::consts::OS {
        "macos" => "macos".to_string(),
        "windows" => "windows".to_string(),
        "linux" => "linux".to_string(),
        "ios" => "ios".to_string(),
        "android" => "android".to_string(),
        other => other.to_string(),
    }
}

/// True when the stored name is a generic auto fallback the user never chose.
pub fn is_placeholder_display_name(name: &str) -> bool {
    let trimmed = name.trim();
    trimmed.is_empty()
        || trimmed.eq_ignore_ascii_case("altsendme")
        || trimmed.eq_ignore_ascii_case("altsendme device")
        || trimmed.eq_ignore_ascii_case("dashbeam")
        || trimmed.eq_ignore_ascii_case("dashbeam device")
        || trimmed.eq_ignore_ascii_case("android phone")
        || trimmed.eq_ignore_ascii_case("android tablet")
}

pub fn default_display_name() -> String {
    #[cfg(target_os = "android")]
    if let Some(name) = android_default_display_name() {
        return name;
    }

    let raw = std::env::var("HOSTNAME")
        .or_else(|_| std::env::var("COMPUTERNAME"))
        .unwrap_or_else(|_| {
            if cfg!(target_os = "android") {
                "Android Phone".to_string()
            } else {
                "DashBeam Device".to_string()
            }
        });
    let trimmed = raw.trim_end_matches(".local").trim();
    if trimmed.is_empty() {
        if cfg!(target_os = "android") {
            "Android Phone".to_string()
        } else {
            "DashBeam Device".to_string()
        }
    } else {
        trimmed.to_string()
    }
}

#[cfg(target_os = "android")]
fn android_default_display_name() -> Option<String> {
    // Prefer the user-facing marketed name when OEMs expose it.
    for key in [
        "ro.product.marketname",
        "ro.product.model",
        "ro.product.name",
        "net.hostname",
    ] {
        if let Some(value) = android_getprop(key) {
            let trimmed = value.trim();
            if !trimmed.is_empty() && !is_placeholder_display_name(trimmed) {
                return Some(trimmed.to_string());
            }
        }
    }
    None
}

#[cfg(target_os = "android")]
fn android_getprop(key: &str) -> Option<String> {
    let output = std::process::Command::new("getprop").arg(key).output().ok()?;
    if !output.status.success() {
        return None;
    }
    let value = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if value.is_empty() {
        None
    } else {
        Some(value)
    }
}

pub fn default_device_type() -> String {
    if cfg!(any(target_os = "ios", target_os = "android")) {
        "phone".to_string()
    } else if cfg!(target_os = "macos") {
        detect_macos_device_type().unwrap_or_else(|| "laptop".to_string())
    } else if cfg!(target_os = "linux") {
        detect_linux_device_type().unwrap_or_else(|| "desktop".to_string())
    } else if cfg!(target_os = "windows") {
        detect_windows_device_type().unwrap_or_else(|| "desktop".to_string())
    } else {
        "desktop".to_string()
    }
}

/// Classify a Mac from `hw.model` when the identifier is unambiguous.
///
/// Returns `None` for Apple Silicon `Mac##,#` IDs that need a battery check.
pub fn device_type_from_mac_model(model: &str) -> Option<&'static str> {
    let lower = model.trim().to_ascii_lowercase();
    if lower.is_empty() {
        return None;
    }
    // MacBook, MacBookAir, MacBookPro — and any future *Book* marketing name.
    if lower.contains("book") {
        return Some("laptop");
    }
    if lower.starts_with("imac")
        || lower.starts_with("macmini")
        || lower.starts_with("macpro")
        || lower.starts_with("macstudio")
    {
        return Some("desktop");
    }
    None
}

#[cfg(target_os = "macos")]
fn detect_macos_device_type() -> Option<String> {
    if let Some(model) = macos_hw_model() {
        if let Some(kind) = device_type_from_mac_model(&model) {
            return Some(kind.to_string());
        }
    }
    // Ambiguous Mac##,# IDs (and missing sysctl): use internal battery.
    macos_has_internal_battery().map(|has_battery| {
        if has_battery {
            "laptop".to_string()
        } else {
            "desktop".to_string()
        }
    })
}

#[cfg(not(target_os = "macos"))]
fn detect_macos_device_type() -> Option<String> {
    None
}

#[cfg(target_os = "macos")]
fn macos_hw_model() -> Option<String> {
    let output = std::process::Command::new("sysctl")
        .args(["-n", "hw.model"])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let model = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if model.is_empty() {
        None
    } else {
        Some(model)
    }
}

#[cfg(target_os = "macos")]
fn macos_has_internal_battery() -> Option<bool> {
    let output = std::process::Command::new("pmset")
        .args(["-g", "batt"])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let text = String::from_utf8_lossy(&output.stdout);
    Some(text.contains("InternalBattery"))
}

/// Map SMBIOS chassis type codes to a form-factor string.
///
/// See [SMBIOS Reference Specification](https://www.dmtf.org/standards/smbios) —
/// System Enclosure or Chassis Types.
pub fn device_type_from_chassis(chassis: u32) -> Option<&'static str> {
    match chassis {
        // Portable / Laptop / Notebook / Sub Notebook / Convertible
        8 | 9 | 10 | 14 | 31 => Some("laptop"),
        // Tablet / Detachable
        30 | 32 => Some("tablet"),
        // Hand Held
        11 => Some("phone"),
        // Desktop, towers, AIO, server/blade, mini PC, etc.
        3 | 4 | 5 | 6 | 7 | 13 | 15 | 16 | 17 | 23 | 24 | 28 | 29 | 34 | 35 | 36 => {
            Some("desktop")
        }
        _ => None,
    }
}

#[cfg(target_os = "linux")]
fn detect_linux_device_type() -> Option<String> {
    let raw = std::fs::read_to_string("/sys/class/dmi/id/chassis_type").ok()?;
    let chassis = raw.trim().parse::<u32>().ok()?;
    device_type_from_chassis(chassis).map(str::to_string)
}

#[cfg(not(target_os = "linux"))]
fn detect_linux_device_type() -> Option<String> {
    None
}

#[cfg(target_os = "windows")]
fn detect_windows_device_type() -> Option<String> {
    // SMBIOS chassis via WMI needs a process spawn; battery presence is instant
    // and correctly separates almost all laptops from desktops.
    windows_has_system_battery().map(|has_battery| {
        if has_battery {
            "laptop".to_string()
        } else {
            "desktop".to_string()
        }
    })
}

#[cfg(not(target_os = "windows"))]
fn detect_windows_device_type() -> Option<String> {
    None
}

/// `BatteryFlag` bit for "no system battery" from `SYSTEM_POWER_STATUS`.
#[cfg(target_os = "windows")]
const BATTERY_FLAG_NO_BATTERY: u8 = 128;

#[cfg(target_os = "windows")]
fn windows_has_system_battery() -> Option<bool> {
    #[repr(C)]
    struct SystemPowerStatus {
        ac_line_status: u8,
        battery_flag: u8,
        battery_life_percent: u8,
        system_status_flag: u8,
        battery_life_time: u32,
        battery_full_life_time: u32,
    }

    #[link(name = "kernel32")]
    extern "system" {
        fn GetSystemPowerStatus(status: *mut SystemPowerStatus) -> i32;
    }

    let mut status = SystemPowerStatus {
        ac_line_status: 0,
        battery_flag: 0,
        battery_life_percent: 0,
        system_status_flag: 0,
        battery_life_time: 0,
        battery_full_life_time: 0,
    };
    // SAFETY: status is a valid writable SYSTEM_POWER_STATUS.
    let ok = unsafe { GetSystemPowerStatus(&mut status) };
    if ok == 0 {
        return None;
    }
    Some(status.battery_flag & BATTERY_FLAG_NO_BATTERY == 0)
}

#[cfg(test)]
mod tests {
    use super::{
        device_type_from_chassis, device_type_from_mac_model, is_placeholder_display_name,
    };

    #[test]
    fn chassis_maps_laptops_and_desktops() {
        assert_eq!(device_type_from_chassis(9), Some("laptop"));
        assert_eq!(device_type_from_chassis(10), Some("laptop"));
        assert_eq!(device_type_from_chassis(14), Some("laptop"));
        assert_eq!(device_type_from_chassis(31), Some("laptop"));
        assert_eq!(device_type_from_chassis(3), Some("desktop"));
        assert_eq!(device_type_from_chassis(7), Some("desktop"));
        assert_eq!(device_type_from_chassis(13), Some("desktop"));
        assert_eq!(device_type_from_chassis(35), Some("desktop"));
        assert_eq!(device_type_from_chassis(30), Some("tablet"));
        assert_eq!(device_type_from_chassis(2), None);
    }

    #[test]
    fn mac_model_maps_clear_identifiers() {
        assert_eq!(device_type_from_mac_model("MacBookAir10,1"), Some("laptop"));
        assert_eq!(device_type_from_mac_model("MacBookPro18,3"), Some("laptop"));
        assert_eq!(device_type_from_mac_model("iMac21,1"), Some("desktop"));
        assert_eq!(device_type_from_mac_model("Macmini9,1"), Some("desktop"));
        assert_eq!(device_type_from_mac_model("MacPro7,1"), Some("desktop"));
        assert_eq!(device_type_from_mac_model("Mac13,1"), None); // ambiguous; needs battery
        assert_eq!(device_type_from_mac_model("Mac14,7"), None);
    }

    #[test]
    fn placeholder_display_names() {
        assert!(is_placeholder_display_name(""));
        assert!(is_placeholder_display_name("  "));
        assert!(is_placeholder_display_name("altsendme"));
        assert!(is_placeholder_display_name("AltSendme Device"));
        assert!(is_placeholder_display_name("dashbeam"));
        assert!(is_placeholder_display_name("DashBeam Device"));
        assert!(is_placeholder_display_name("Android Phone"));
        assert!(!is_placeholder_display_name("Pixel 8"));
        assert!(!is_placeholder_display_name("Tony's phone"));
    }
}

pub fn normalize_display_name(name: &str) -> Result<String, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Device name cannot be empty".to_string());
    }
    if trimmed.chars().count() > DeviceMetaFile::MAX_DISPLAY_NAME_CHARS {
        return Err(format!(
            "Device name must be at most {} characters",
            DeviceMetaFile::MAX_DISPLAY_NAME_CHARS
        ));
    }
    Ok(trimmed.to_string())
}
