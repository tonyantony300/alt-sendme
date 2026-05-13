use serde::de::DeserializeOwned;
use tauri::{AppHandle, Runtime, ipc::Channel, plugin::PluginApi};

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

impl<R: Runtime> NativeUtils<R> {
    pub fn select_send_document(&self, _: Channel) -> crate::Result<bool> {
        Err(crate::Error::UnsupportedPlafrormError)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn select_send_folder(&self, _: Channel) -> crate::Result<bool> {
        Err(crate::Error::UnsupportedPlafrormError)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn cancel_job(&self, _: AsyncJob) -> crate::Result<()> {
        Err(crate::Error::UnsupportedPlafrormError)
    }
}
