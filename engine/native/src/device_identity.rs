use std::path::{Path, PathBuf};
use std::sync::{Mutex, RwLock};

use anyhow::Context;
use data_encoding::HEXLOWER;
use iroh::SecretKey;
use protocol::{
    default_device_type, default_display_name, detect_os, is_placeholder_display_name,
    normalize_display_name, DeviceMetaFile, PairedDevice, PairedDeviceList, PairingStatus,
};
use serde::{Deserialize, Serialize};

use crate::identity_store;

#[derive(Debug)]
pub struct DeviceIdentity {
    pub secret_key: SecretKey,
    meta: RwLock<DeviceMetaFile>,
    meta_path: PathBuf,
    /// Set when keychain identity differed from device.json on load.
    pub identity_rotated: bool,
    pub previous_endpoint_id: Option<String>,
}

impl DeviceIdentity {
    pub fn endpoint_id(&self) -> String {
        HEXLOWER.encode(self.secret_key.public().as_bytes())
    }

    pub fn display_name(&self) -> String {
        self.meta
            .read()
            .expect("device meta lock")
            .display_name
            .clone()
    }

    pub fn device_type(&self) -> String {
        self.meta
            .read()
            .expect("device meta lock")
            .device_type
            .clone()
    }

    pub fn os(&self) -> String {
        self.meta.read().expect("device meta lock").os.clone()
    }

    pub fn set_display_name(&self, name: &str) -> anyhow::Result<DeviceInfo> {
        let normalized = normalize_display_name(name).map_err(anyhow::Error::msg)?;
        {
            let mut meta = self.meta.write().expect("device meta lock");
            meta.display_name = normalized;
            meta.name_is_custom = true;
            meta.migrate();
            Self::write_meta(&self.meta_path, &meta)?;
        }
        Ok(DeviceInfo::from(self))
    }
}

pub struct PairedDeviceStore {
    path: PathBuf,
    /// Serializes all read-modify-write cycles so concurrent callers don't
    /// race on the shared `.tmp` rename path.
    file_lock: Mutex<()>,
}

impl PairedDeviceStore {
    pub fn new(data_dir: &Path) -> Self {
        Self {
            path: data_dir.join("paired-devices.json"),
            file_lock: Mutex::new(()),
        }
    }

    /// The guard protects no in-memory state, so poisoning would only turn a
    /// one-off panic into a permanently unusable store.
    fn lock_file(&self) -> std::sync::MutexGuard<'_, ()> {
        self.file_lock
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
    }

    pub fn list(&self) -> anyhow::Result<Vec<PairedDevice>> {
        let file = self.read_file()?;
        Ok(file.devices)
    }

    pub fn get(&self, endpoint_id: &str) -> anyhow::Result<Option<PairedDevice>> {
        let id = endpoint_id.to_lowercase();
        Ok(self
            .list()?
            .into_iter()
            .find(|d| d.endpoint_id.to_lowercase() == id))
    }

    pub fn remember(&self, device: PairedDevice) -> anyhow::Result<PairedDevice> {
        let _guard = self.lock_file();
        let mut file = self.read_file()?;
        let id = device.endpoint_id.to_lowercase();
        if let Some(existing) = file
            .devices
            .iter_mut()
            .find(|d| d.endpoint_id.to_lowercase() == id)
        {
            existing.display_name = device.display_name;
            existing.device_type = device.device_type;
            existing.os = device.os;
            existing.last_seen_at = device.last_seen_at;
            if device.relay_url.is_some() {
                existing.relay_url = device.relay_url;
            }
            existing.pairing_status = PairingStatus::Active;
            let saved = existing.clone();
            self.write_file(&file)?;

            return Ok(saved);
        }
        file.devices.push(device.clone());
        self.write_file(&file)?;

        Ok(device)
    }

    pub fn rename(&self, endpoint_id: &str, display_name: &str) -> anyhow::Result<PairedDevice> {
        let normalized = normalize_display_name(display_name).map_err(anyhow::Error::msg)?;
        let _guard = self.lock_file();
        let mut file = self.read_file()?;
        let id = endpoint_id.to_lowercase();
        let existing = file
            .devices
            .iter_mut()
            .find(|d| d.endpoint_id.to_lowercase() == id)
            .context("paired device not found")?;
        existing.display_name = normalized;
        let saved = existing.clone();
        self.write_file(&file)?;
        Ok(saved)
    }

    pub fn forget(&self, endpoint_id: &str) -> anyhow::Result<()> {
        let _guard = self.lock_file();
        let mut file = self.read_file()?;
        let id = endpoint_id.to_lowercase();
        file.devices
            .retain(|d| d.endpoint_id.to_lowercase() != id);
        self.write_file(&file)?;
        Ok(())
    }

    pub fn touch(&self, endpoint_id: &str, last_seen_at: u64) -> anyhow::Result<()> {
        let _guard = self.lock_file();
        let mut file = self.read_file()?;
        let id = endpoint_id.to_lowercase();
        if let Some(existing) = file
            .devices
            .iter_mut()
            .find(|d| d.endpoint_id.to_lowercase() == id)
        {
            existing.last_seen_at = last_seen_at;
            self.write_file(&file)?;
        }
        Ok(())
    }

    pub fn mark_unpaired_remotely(&self, endpoint_id: &str) -> anyhow::Result<Option<PairedDevice>> {
        let _guard = self.lock_file();
        let mut file = self.read_file()?;
        let id = endpoint_id.to_lowercase();
        let saved = if let Some(existing) = file
            .devices
            .iter_mut()
            .find(|d| d.endpoint_id.to_lowercase() == id)
        {
            existing.pairing_status = PairingStatus::UnpairedRemotely;
            Some(existing.clone())
        } else {
            None
        };
        if saved.is_some() {
            self.write_file(&file)?;
        }
        Ok(saved)
    }

    pub fn mark_stale_after_local_identity_rotation(&self) -> anyhow::Result<usize> {
        let _guard = self.lock_file();
        let mut file = self.read_file()?;
        let mut updated = 0usize;
        for device in &mut file.devices {
            if device.pairing_status == PairingStatus::Active {
                device.pairing_status = PairingStatus::StaleLocalIdentity;
                updated += 1;
            }
        }
        if updated > 0 {
            self.write_file(&file)?;

        }
        Ok(updated)
    }

    fn read_file(&self) -> anyhow::Result<PairedDeviceList> {
        if !self.path.exists() {
            return Ok(PairedDeviceList::default());
        }
        let raw = std::fs::read_to_string(&self.path)
            .with_context(|| format!("read {}", self.path.display()))?;
        Ok(serde_json::from_str(&raw).unwrap_or_default())
    }

    fn write_file(&self, list: &PairedDeviceList) -> anyhow::Result<()> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let tmp = self.path.with_extension("json.tmp");
        std::fs::write(&tmp, serde_json::to_string_pretty(list)?)?;
        std::fs::rename(&tmp, &self.path)?;
        Ok(())
    }
}

impl DeviceIdentity {
    fn write_meta(path: &Path, meta: &DeviceMetaFile) -> anyhow::Result<()> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let tmp = path.with_extension("json.tmp");
        std::fs::write(&tmp, serde_json::to_string_pretty(meta)?)?;
        std::fs::rename(&tmp, path)?;
        Ok(())
    }
}

pub fn load_or_create_identity(data_dir: &Path) -> anyhow::Result<DeviceIdentity> {
    std::fs::create_dir_all(data_dir)?;
    let meta_path = data_dir.join("device.json");

    let outcome = identity_store::load_or_create_secret(data_dir)?;
    let secret = outcome.secret;
    // Node identity is only for the persistent control endpoint. Share/receive
    // sessions use ephemeral keys via get_or_create_secret() so they do not
    // collide with this endpoint on the relay.
    let endpoint_id = HEXLOWER.encode(secret.public().as_bytes());

    if matches!(
        outcome.source,
        identity_store::SecretSource::KeychainMigrated | identity_store::SecretSource::Generated
    ) {

    }

    let mut identity_rotated = false;
    let mut previous_endpoint_id = None;
    let mut meta = if meta_path.exists() {
        let raw = std::fs::read_to_string(&meta_path)?;
        let mut meta: DeviceMetaFile =
            serde_json::from_str(&raw).context("invalid device.json")?;
        if meta.endpoint_id.to_lowercase() != endpoint_id {
            identity_rotated = true;
            previous_endpoint_id = Some(meta.endpoint_id.clone());
            tracing::warn!("device.json endpoint_id mismatch; syncing to persisted identity");


            meta.endpoint_id = endpoint_id;
        }
        meta.migrate();
        // Refresh auto-detected hostname only when the user has not renamed.
        if !meta.name_is_custom {
            let detected = default_display_name();
            if is_placeholder_display_name(&meta.display_name) {
                meta.display_name = detected;
            }
        }
        if meta.os.trim().is_empty() {
            meta.os = detect_os();
        }
        // Re-detect form factor on load (not user-editable yet) so older
        // Linux/Windows installs that were hard-coded as "desktop" self-heal.
        meta.device_type = default_device_type();
        meta
    } else {
        DeviceMetaFile::new(endpoint_id, default_display_name(), default_device_type())
    };

    meta.migrate();
    DeviceIdentity::write_meta(&meta_path, &meta)?;

    Ok(DeviceIdentity {
        secret_key: secret,
        meta: RwLock::new(meta),
        meta_path,
        identity_rotated,
        previous_endpoint_id,
    })
}

/// Serializable paired device for the frontend, including ephemeral presence.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairedDeviceInfo {
    pub endpoint_id: String,
    pub display_name: String,
    pub device_type: String,
    pub os: String,
    pub paired_at: u64,
    pub last_seen_at: u64,
    #[serde(default)]
    pub relay_url: Option<String>,
    #[serde(default)]
    pub pairing_status: PairingStatus,
    pub online: bool,
}

impl PairedDeviceInfo {
    pub fn from_device(device: PairedDevice, online: bool) -> Self {
        Self {
            endpoint_id: device.endpoint_id,
            display_name: device.display_name,
            device_type: device.device_type,
            os: device.os,
            paired_at: device.paired_at,
            last_seen_at: device.last_seen_at,
            relay_url: device.relay_url,
            pairing_status: device.pairing_status,
            online,
        }
    }
}

/// Online/total counts across *actively* paired devices, for the tray summary.
/// Peers that unpaired remotely — or whose local identity went stale — are
/// excluded from both counts: the tray must not advertise a device the user
/// cannot actually reach.
pub fn presence_summary(devices: &[PairedDeviceInfo]) -> (usize, usize) {
    let active = devices.iter().filter(|d| d.pairing_status.is_active());
    let total = active.clone().count();
    let online = active.filter(|d| d.online).count();
    (online, total)
}

/// Serializable device info for the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub endpoint_id: String,
    pub display_name: String,
    pub device_type: String,
    pub os: String,
}

impl From<&DeviceIdentity> for DeviceInfo {
    fn from(id: &DeviceIdentity) -> Self {
        Self {
            endpoint_id: id.endpoint_id(),
            display_name: id.display_name(),
            device_type: id.device_type(),
            os: id.os(),
        }
    }
}

#[cfg(test)]
mod presence_summary_tests {
    use super::*;
    use protocol::identity::PairingStatus;

    fn info(endpoint_id: &str, online: bool, status: PairingStatus) -> PairedDeviceInfo {
        PairedDeviceInfo {
            endpoint_id: endpoint_id.to_string(),
            display_name: "Device".to_string(),
            device_type: "laptop".to_string(),
            os: "macos".to_string(),
            paired_at: 0,
            last_seen_at: 0,
            relay_url: None,
            pairing_status: status,
            online,
        }
    }

    #[test]
    fn counts_only_actively_paired_devices() {
        let devices = vec![
            info("a", true, PairingStatus::Active),
            info("b", false, PairingStatus::Active),
            info("c", true, PairingStatus::Active),
        ];
        assert_eq!(presence_summary(&devices), (2, 3));
    }

    #[test]
    fn excludes_inactive_pairings_from_both_counts() {
        // An unpaired-remotely peer must not be advertised in the tray, even
        // if a stale presence entry still says it is online.
        let devices = vec![
            info("a", true, PairingStatus::Active),
            info("b", true, PairingStatus::UnpairedRemotely),
            info("c", false, PairingStatus::StaleLocalIdentity),
        ];
        assert_eq!(presence_summary(&devices), (1, 1));
    }

    #[test]
    fn empty_list_is_zero_of_zero() {
        assert_eq!(presence_summary(&[]), (0, 0));
    }
}
