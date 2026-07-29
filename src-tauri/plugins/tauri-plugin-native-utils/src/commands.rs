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
pub(crate) async fn consume_share_intent<R: Runtime>(
    app: AppHandle<R>,
    channel: Channel,
) -> Result<bool> {
    app.native_utils().consume_share_intent(channel)
}

#[command]
pub(crate) async fn cancel_job<R: Runtime>(
    app: tauri::AppHandle<R>,
    job: AsyncJob,
) -> Result<()> {
    app.native_utils().cancel_job(job)
}

#[command]
pub(crate) async fn export_to_tree<R: Runtime>(
    app: AppHandle<R>,
    args: ExportToTreeArgs,
) -> Result<ExportToTreeResult> {
    app.native_utils().export_to_tree(args)
}

#[command]
pub(crate) async fn get_window_insets<R: Runtime>(app: AppHandle<R>) -> Result<WindowInsets> {
    app.native_utils().get_window_insets()
}

#[command]
pub(crate) async fn open_download_folder<R: Runtime>(
    app: AppHandle<R>,
    tree_uri: String,
) -> Result<()> {
    app.native_utils()
        .open_download_folder(OpenDownloadFolderArgs { tree_uri })
}
