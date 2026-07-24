//! Windows Explorer "Send with DashBeam" shell verb registration.
//!
//! Registration is intentionally **per-user (HKCU)** so the settings toggle
//! works without elevation. Older MSI builds wrote the same verb under **HKLM**,
//! which overlays with HKCU — disabling only HKCU left the menu text visible
//! (often without an icon). Unregister therefore clears both hives.

#[cfg(target_os = "windows")]
use anyhow::Context;
#[cfg(target_os = "windows")]
use std::path::PathBuf;
#[cfg(target_os = "windows")]
use winreg::enums::*;
#[cfg(target_os = "windows")]
use winreg::{RegKey, HKEY};

#[cfg(target_os = "windows")]
const VERB_NAME: &str = "Send with DashBeam";

/// Pre-rename verb — still cleared on unregister so upgrades do not leave leftovers.
#[cfg(target_os = "windows")]
const LEGACY_VERB_NAME: &str = "Send with AltSendme";

/// Shell classes that host the context-menu verb.
#[cfg(target_os = "windows")]
const VERB_BASES: &[&str] = &["*", "Directory", "Directory\\Background"];

#[cfg(target_os = "windows")]
pub fn get_current_exe_path() -> anyhow::Result<PathBuf> {
    let exe = std::env::current_exe().context("failed to resolve current executable path")?;
    Ok(dunce::canonicalize(exe).unwrap_or_else(|_| std::env::current_exe().unwrap()))
}

/// True if our verb is present in either HKCU or HKLM (any of the three class keys).
#[cfg(target_os = "windows")]
pub fn is_context_menu_registered() -> anyhow::Result<bool> {
    for &hive in &[HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE] {
        if verb_exists_in_hive(hive)? {
            return Ok(true);
        }
    }
    Ok(false)
}

#[cfg(target_os = "windows")]
pub fn register_context_menu() -> anyhow::Result<()> {
    let exe_path = get_current_exe_path()?;
    let exe_str = exe_path
        .to_str()
        .ok_or_else(|| anyhow::anyhow!("Invalid path"))?;
    let icon_path = format!("{},0", exe_str);

    // Drop any machine-wide leftover first so HKCU is the sole source of truth.
    // Best-effort: failure here is non-fatal if we can still write HKCU.
    let _ = remove_verb_from_hive(HKEY_LOCAL_MACHINE);
    // Drop the pre-rename verb so upgrades do not leave two Explorer entries.
    let _ = remove_named_verb_from_hive(HKEY_CURRENT_USER, LEGACY_VERB_NAME);
    let _ = remove_named_verb_from_hive(HKEY_LOCAL_MACHINE, LEGACY_VERB_NAME);

    for &base in VERB_BASES {
        let arg = if base == "Directory\\Background" {
            "\"%V\""
        } else {
            "\"%1\""
        };
        write_registry_key(base, VERB_NAME, exe_str, &icon_path, arg)?;
    }

    notify_shell_change();
    Ok(())
}

/// Remove the Explorer verb from HKCU and, when possible, HKLM.
///
/// When `allow_elevation` is true and machine-wide (HKLM) leftovers remain,
/// prompts once via UAC so a settings toggle can fully clear older MSI keys.
/// Startup sync should pass `false` to avoid surprising elevation prompts.
#[cfg(target_os = "windows")]
pub fn unregister_context_menu(allow_elevation: bool) -> anyhow::Result<()> {
    // Always clear the user hive (this is what the toggle owns).
    remove_verb_from_hive(HKEY_CURRENT_USER)
        .context("failed to remove Explorer context menu from HKCU")?;

    // Clear machine-wide leftovers from older MSI installs.
    if verb_exists_in_hive(HKEY_LOCAL_MACHINE).unwrap_or(false) {
        let removed = remove_verb_from_hive(HKEY_LOCAL_MACHINE).is_ok()
            && !verb_exists_in_hive(HKEY_LOCAL_MACHINE).unwrap_or(false);

        if !removed && allow_elevation {
            remove_hklm_verb_elevated()?;
        }

        if verb_exists_in_hive(HKEY_LOCAL_MACHINE).unwrap_or(false) {
            if allow_elevation {
                anyhow::bail!(
                    "Could not remove the machine-wide Explorer context menu. \
                     Run DashBeam once as administrator and disable the option again, \
                     or uninstall the app."
                );
            }
            // Quiet path (startup sync): HKCU is clean; HKLM will be cleared on
            // uninstall or the next explicit disable with elevation.
            tracing::warn!(
                "Explorer context menu still present under HKLM; will need elevation to remove"
            );
        }
    }

    notify_shell_change();
    Ok(())
}

#[cfg(target_os = "windows")]
fn verb_key_path(base: &str) -> String {
    format!(r"Software\Classes\{}\shell\{}", base, VERB_NAME)
}

#[cfg(target_os = "windows")]
fn verb_exists_in_hive(hive: HKEY) -> anyhow::Result<bool> {
    let root = RegKey::predef(hive);
    for &base in VERB_BASES {
        if root.open_subkey(verb_key_path(base)).is_ok() {
            return Ok(true);
        }
    }
    Ok(false)
}

#[cfg(target_os = "windows")]
fn write_registry_key(
    base: &str,
    name: &str,
    exe_path: &str,
    icon_path: &str,
    arg: &str,
) -> anyhow::Result<()> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let path = format!(r"Software\Classes\{}", base);
    // create_subkey builds the Classes\* / Directory tree if missing.
    let (classes, _) = hkcu
        .create_subkey_with_flags(&path, KEY_READ | KEY_WRITE)
        .with_context(|| format!(r"failed to open/create HKCU\{}", path))?;

    let key_path = format!(r"shell\{}", name);
    let (shell_key, _) = classes
        .create_subkey(&key_path)
        .with_context(|| format!("failed to create context menu key {}", key_path))?;

    // Default value + MUIVerb both set to the display name for Explorer compatibility.
    shell_key
        .set_value("", &name)
        .context("failed to set context menu display name")?;
    shell_key
        .set_value("MUIVerb", &name)
        .context("failed to set MUIVerb")?;
    shell_key
        .set_value("Icon", &icon_path)
        .context("failed to set Icon")?;

    let (cmd_key, _) = shell_key
        .create_subkey("command")
        .context("failed to create command subkey")?;

    let command = format!("\"{}\" {}", exe_path, arg);
    cmd_key
        .set_value("", &command)
        .context("failed to set command for context menu")?;
    Ok(())
}

#[cfg(target_os = "windows")]
fn remove_verb_from_hive(hive: HKEY) -> anyhow::Result<()> {
    remove_named_verb_from_hive(hive, VERB_NAME)?;
    // Always attempt legacy cleanup; ignore "already gone".
    let _ = remove_named_verb_from_hive(hive, LEGACY_VERB_NAME);
    Ok(())
}

#[cfg(target_os = "windows")]
fn remove_named_verb_from_hive(hive: HKEY, verb: &str) -> anyhow::Result<()> {
    let root = RegKey::predef(hive);
    let mut errors: Vec<String> = Vec::new();

    for &base in VERB_BASES {
        let shell_path = format!(r"Software\Classes\{}\shell", base);
        match root.open_subkey_with_flags(&shell_path, KEY_READ | KEY_WRITE) {
            Ok(shell_key) => {
                if let Err(e) = shell_key.delete_subkey_all(verb) {
                    // ERROR_FILE_NOT_FOUND (2) means already gone — treat as success.
                    if e.raw_os_error() != Some(2) {
                        errors.push(format!("{}: {}", shell_path, e));
                    }
                }
            }
            Err(e) => {
                if e.raw_os_error() != Some(2) {
                    errors.push(format!("open {}: {}", shell_path, e));
                }
            }
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        anyhow::bail!("{}", errors.join("; "))
    }
}

/// Remove leftover HKLM verb keys via an elevated `reg delete` (one UAC prompt).
#[cfg(target_os = "windows")]
fn remove_hklm_verb_elevated() -> anyhow::Result<()> {
    use windows::core::{w, HSTRING, PCWSTR};
    use windows::Win32::Foundation::{CloseHandle, ERROR_CANCELLED, WAIT_OBJECT_0};
    use windows::Win32::System::Threading::{WaitForSingleObject, INFINITE};
    use windows::Win32::UI::Shell::{ShellExecuteExW, SEE_MASK_NOCLOSEPROCESS, SHELLEXECUTEINFOW};
    use windows::Win32::UI::WindowsAndMessaging::SW_HIDE;

    let deletes: String = VERB_BASES
        .iter()
        .flat_map(|base| {
            [VERB_NAME, LEGACY_VERB_NAME].into_iter().map(move |verb| {
                format!(
                    r#"reg delete "HKLM\SOFTWARE\Classes\{}\shell\{}" /f"#,
                    base, verb
                )
            })
        })
        .collect::<Vec<_>>()
        .join(" & ");

    let params = HSTRING::from(format!("/C {}", deletes));
    let mut info = SHELLEXECUTEINFOW {
        cbSize: std::mem::size_of::<SHELLEXECUTEINFOW>() as u32,
        fMask: SEE_MASK_NOCLOSEPROCESS,
        lpVerb: w!("runas"),
        lpFile: w!("cmd.exe"),
        lpParameters: PCWSTR(params.as_ptr()),
        nShow: SW_HIDE.0 as i32,
        ..Default::default()
    };

    let ok = unsafe { ShellExecuteExW(&mut info) };
    if let Err(err) = ok {
        if err.code() == windows::core::HRESULT::from_win32(ERROR_CANCELLED.0) {
            anyhow::bail!("Administrator approval was cancelled");
        }
        anyhow::bail!(
            "Failed to request elevation to remove context menu: {}",
            err
        );
    }

    if info.hProcess.is_invalid() {
        anyhow::bail!("Elevated process did not return a handle");
    }

    unsafe {
        let wait = WaitForSingleObject(info.hProcess, INFINITE);
        let _ = CloseHandle(info.hProcess);
        if wait != WAIT_OBJECT_0 {
            anyhow::bail!("Timed out waiting for elevated context-menu cleanup");
        }
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn notify_shell_change() {
    use windows::Win32::UI::Shell::{SHChangeNotify, SHCNE_ASSOCCHANGED, SHCNF_IDLIST};

    // Tell Explorer that file associations / shell verbs changed.
    unsafe {
        SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_IDLIST, None, None);
    }

    // Also refresh the icon cache (best-effort).
    let _ = std::process::Command::new("ie4uinit.exe")
        .arg("-show")
        .spawn();
}

// Stubs for non-Windows platforms
#[cfg(not(target_os = "windows"))]
#[allow(dead_code)]
pub fn register_context_menu() -> anyhow::Result<()> {
    Ok(())
}

#[cfg(not(target_os = "windows"))]
#[allow(dead_code)]
pub fn unregister_context_menu(_allow_elevation: bool) -> anyhow::Result<()> {
    Ok(())
}

#[cfg(not(target_os = "windows"))]
#[allow(dead_code)]
pub fn is_context_menu_registered() -> anyhow::Result<bool> {
    Ok(false)
}
