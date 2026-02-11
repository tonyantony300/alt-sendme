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
