use tauri::ipc::Channel;
use tauri::{command, AppHandle, Runtime};

use crate::models::*;
use crate::NativeUtilsExt;
use crate::Result;

#[command]
pub(crate) async fn select_download_folder<R: Runtime>(
    app: AppHandle<R>,
) -> Result<SelectDonwloadFolderResponse> {
    app.native_utils().select_download_folder()
}

#[command]
pub(crate) async fn select_send_document<R: Runtime>(
    app: AppHandle<R>,
    channel: Channel,
) -> Result<bool> {
    app.native_utils().select_send_document(channel)
}

#[command]
pub(crate) async fn select_send_folder<R: Runtime>(
    app: AppHandle<R>,
    channel: Channel,
) -> Result<bool> {
    app.native_utils().select_send_folder(channel)
}

#[command]
pub(crate) async fn cancel_job<R: Runtime>(
    app: tauri::AppHandle<R>,
    job: AsyncJob,
) -> Result<()> {
    app.native_utils().cancel_job(job)
}