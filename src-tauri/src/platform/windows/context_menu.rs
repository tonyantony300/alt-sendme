// TODO: Currently commands for unregistering the context menu is commented out, as it is not yet implemented when the settings route is built: create a toggle for context menu

#[cfg(target_os = "windows")]
use anyhow::Context;
#[cfg(target_os = "windows")]
use std::path::PathBuf;
#[cfg(target_os = "windows")]
use winreg::enums::*;
#[cfg(target_os = "windows")]
use winreg::RegKey;

#[cfg(target_os = "windows")]
pub fn get_current_exe_path() -> anyhow::Result<PathBuf> {
    let exe = std::env::current_exe().context("failed to resolve current executable path")?;
    Ok(dunce::canonicalize(exe).unwrap_or_else(|_| std::env::current_exe().unwrap()))
}

#[cfg(target_os = "windows")]
pub fn is_context_menu_registered() -> anyhow::Result<bool> {
    let exe_path = get_current_exe_path()?;
    let exe_str = exe_path
        .to_str()
        .ok_or_else(|| anyhow::anyhow!("Invalid path"))?;

    // Check if the command key matches our current executable
    // We check just one, assuming they are in sync
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let path = "Software\\Classes\\*\\shell\\Send with AltSendme\\command";

    if let Ok(key) = hkcu.open_subkey_with_flags(path, KEY_READ) {
        if let Ok(command_val) = key.get_value::<String, _>("") {
            // Check if command starts with our executable path
            // The command is like: "C:\path\to\exe" "%1"
            let expected_start = format!("\"{}\"", exe_str);
            if command_val.starts_with(&expected_start) {
                return Ok(true);
            }
        }
    }

    Ok(false)
}

#[cfg(target_os = "windows")]
pub fn register_context_menu() -> anyhow::Result<()> {
    // Only register if not already registered or path mismatch
    if is_context_menu_registered().unwrap_or(false) {
        return Ok(());
    }

    let exe_path = get_current_exe_path()?;
    let exe_str = exe_path
        .to_str()
        .ok_or_else(|| anyhow::anyhow!("Invalid path"))?;
    // Use the first icon resource from the executable
    let icon_path = format!("{},0", exe_str);

    // Register for Files (*)
    write_registry_key("*", "Send with AltSendme", exe_str, &icon_path, "\"%1\"")?;

    // Register for Directories
    write_registry_key(
        "Directory",
        "Send with AltSendme",
        exe_str,
        &icon_path,
        "\"%1\"",
    )?;

    // Register for Directory Backgrounds
    write_registry_key(
        "Directory\\Background",
        "Send with AltSendme",
        exe_str,
        &icon_path,
        "\"%V\"",
    )?;

    notify_icon_change();
    Ok(())
}

// #[cfg(target_os = "windows")]
// pub fn unregister_context_menu() -> anyhow::Result<()> {
//     // Remove for Files
//     remove_registry_key("*", "Send with AltSendme")?;
//
//     // Remove for Directories
//     remove_registry_key("Directory", "Send with AltSendme")?;
//
//     // Remove for Directory Backgrounds
//     remove_registry_key("Directory\\Background", "Send with AltSendme")?;
//
//     notify_icon_change();
//     Ok(())
// }

#[cfg(target_os = "windows")]
fn write_registry_key(
    base: &str,
    name: &str,
    exe_path: &str,
    icon_path: &str,
    arg: &str,
) -> anyhow::Result<()> {
    // HKCU\Software\Classes\{base}\shell\{name}\command
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let path = format!("Software\\Classes\\{}", base);
    let classes = hkcu
        .open_subkey_with_flags(&path, KEY_READ | KEY_WRITE)
        .context(format!("failed to open HKCU\\{}", path))?;

    let key_path = format!("shell\\{}", name);
    // Use create_subkey which opens if exists or creates if not
    let (shell_key, _) = classes
        .create_subkey(&key_path)
        .context(format!("failed to create context menu key {}", key_path))?;

    shell_key.set_value("MUIVerb", &name).ok();
    shell_key.set_value("Icon", &icon_path).ok();

    let (cmd_key, _) = shell_key
        .create_subkey("command")
        .context("failed to create command subkey")?;

    let command = format!("\"{}\" {}", exe_path, arg);
    cmd_key
        .set_value("", &command)
        .context("failed to set command for context menu")?;
    Ok(())
}

// #[cfg(target_os = "windows")]
// fn remove_registry_key(base: &str, name: &str) -> anyhow::Result<()> {
//     let hkcu = RegKey::predef(HKEY_CURRENT_USER);
//     let path = format!("Software\\Classes\\{}\\shell", base);
//
//     match hkcu.open_subkey_with_flags(&path, KEY_READ | KEY_WRITE) {
//         Ok(shell_key) => {
//             let _ = shell_key.delete_subkey_all(name);
//         }
//         Err(_) => {}
//     }
//     Ok(())
// }

#[cfg(target_os = "windows")]
fn notify_icon_change() {
    // Force icon cache refresh by calling ie4uinit.exe
    let _ = std::process::Command::new("ie4uinit.exe")
        .arg("-show")
        .spawn();
}

// Stubs for non-Windows platforms
#[cfg(not(target_os = "windows"))]
#[allow(dead_code)] // Stub function for API consistency, may be used when settings route is implemented
pub fn register_context_menu() -> anyhow::Result<()> {
    Ok(())
}

// #[cfg(not(target_os = "windows"))]
// pub fn unregister_context_menu() -> anyhow::Result<()> {
//     Ok(())
// }
