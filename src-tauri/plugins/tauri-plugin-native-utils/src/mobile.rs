use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_native_utils);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<NativeUtils<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin("com.altsendme.plugin.native_utils", "NativeUtils")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_native_utils)?;
    Ok(NativeUtils(handle))
}

/// Access to the native-utils APIs.
pub struct NativeUtils<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> NativeUtils<R> {
    pub fn select_download_folder(&self) -> crate::Result<SelectDonwloadFolderResponse> {
        self.0
            .run_mobile_plugin("select_download_folder", ())
            .map_err(Into::into)
    }
}
