use serde::de::DeserializeOwned;
use tauri::{ipc::Channel, plugin::PluginApi, AppHandle, Runtime};

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
    pub fn consume_share_intent(&self, _: Channel) -> crate::Result<bool> {
        Ok(false)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn cancel_job(&self, _: AsyncJob) -> crate::Result<()> {
        Err(crate::Error::UnsupportedPlafrormError)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn export_to_tree(&self, _: ExportToTreeArgs) -> crate::Result<ExportToTreeResult> {
        Err(crate::Error::UnsupportedPlafrormError)
    }
}

impl<R: Runtime> NativeUtils<R> {
    /// Desktop windows never draw behind system UI, so there is nothing to inset.
    pub fn get_window_insets(&self) -> crate::Result<WindowInsets> {
        Ok(WindowInsets::default())
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn open_download_folder(&self, _: OpenDownloadFolderArgs) -> crate::Result<()> {
        Err(crate::Error::UnsupportedPlafrormError)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn export_to_media_store(
        &self,
        _: ExportToMediaStoreArgs,
    ) -> crate::Result<ExportToMediaStoreResult> {
        Err(crate::Error::UnsupportedPlafrormError)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn open_download_target(&self, _: OpenDownloadTargetArgs) -> crate::Result<()> {
        Err(crate::Error::UnsupportedPlafrormError)
    }
}

impl<R: Runtime> NativeUtils<R> {
    /// No-op: desktop processes aren't frozen when the window loses focus.
    pub fn start_presence_service(&self) -> crate::Result<()> {
        Ok(())
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn stop_presence_service(&self) -> crate::Result<()> {
        Ok(())
    }
}
