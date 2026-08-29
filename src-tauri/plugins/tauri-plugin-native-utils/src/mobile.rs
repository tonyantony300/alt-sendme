use serde::de::DeserializeOwned;
use tauri::{
    ipc::Channel,
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
    let handle = api.register_android_plugin("com.dashbeam.plugin.native_utils", "NativeUtils")?;
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

impl<R: Runtime> NativeUtils<R> {
    pub fn select_send_document(&self, channel: Channel) -> crate::Result<bool> {
        self.0
            .run_mobile_plugin("select_send_document", SelectItemArgs { channel })
            .map_err(Into::into)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn select_send_folder(&self, channel: Channel) -> crate::Result<bool> {
        self.0
            .run_mobile_plugin("select_send_folder", SelectItemArgs { channel })
            .map_err(Into::into)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn consume_share_intent(&self, channel: Channel) -> crate::Result<bool> {
        self.0
            .run_mobile_plugin("consume_share_intent", SelectItemArgs { channel })
            .map_err(Into::into)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn cancel_job(&self, job: AsyncJob) -> crate::Result<()> {
        self.0
            .run_mobile_plugin("cancel_job", job)
            .map_err(Into::into)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn export_to_tree(&self, args: ExportToTreeArgs) -> crate::Result<ExportToTreeResult> {
        self.0
            .run_mobile_plugin("export_to_tree", args)
            .map_err(Into::into)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn get_window_insets(&self) -> crate::Result<WindowInsets> {
        self.0
            .run_mobile_plugin("get_window_insets", ())
            .map_err(Into::into)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn open_download_folder(&self, args: OpenDownloadFolderArgs) -> crate::Result<()> {
        self.0
            .run_mobile_plugin("open_download_folder", args)
            .map_err(Into::into)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn export_to_media_store(
        &self,
        args: ExportToMediaStoreArgs,
    ) -> crate::Result<ExportToMediaStoreResult> {
        self.0
            .run_mobile_plugin("export_to_media_store", args)
            .map_err(Into::into)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn open_download_target(&self, args: OpenDownloadTargetArgs) -> crate::Result<()> {
        self.0
            .run_mobile_plugin("open_download_target", args)
            .map_err(Into::into)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn start_presence_service(&self) -> crate::Result<()> {
        self.0
            .run_mobile_plugin("start_presence_service", ())
            .map_err(Into::into)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn stop_presence_service(&self) -> crate::Result<()> {
        self.0
            .run_mobile_plugin("stop_presence_service", ())
            .map_err(Into::into)
    }
}

impl<R: Runtime> NativeUtils<R> {
    pub fn write_text_to_uri(&self, args: WriteTextToUriArgs) -> crate::Result<()> {
        self.0
            .run_mobile_plugin("write_text_to_uri", args)
            .map_err(Into::into)
    }
}

impl<R: Runtime> NativeUtils<R> {
    /// Returns the raw response body; the caller parses it.
    pub fn fetch_update_manifest(&self) -> crate::Result<String> {
        self.0
            .run_mobile_plugin("fetch_update_manifest", ())
            .map_err(Into::into)
    }
}
