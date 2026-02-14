use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<NativeUtils<R>> {
    Ok(NativeUtils(app.clone()))
}

/// Access to the native-utils APIs.
pub struct NativeUtils<R: Runtime>(AppHandle<R>);

impl<R: Runtime> NativeUtils<R> {
    pub fn select_download_folder(&self) -> crate::Result<SelectDonwloadFolderResponse> {
        Err(crate::Error::UnsupportedPlafrormError)
    }
}
