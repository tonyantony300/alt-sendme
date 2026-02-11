use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::NativeUtils;
#[cfg(mobile)]
use mobile::NativeUtils;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the native-utils APIs.
pub trait NativeUtilsExt<R: Runtime> {
    fn native_utils(&self) -> &NativeUtils<R>;
}

impl<R: Runtime, T: Manager<R>> crate::NativeUtilsExt<R> for T {
    fn native_utils(&self) -> &NativeUtils<R> {
        self.state::<NativeUtils<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("native-utils")
        .invoke_handler(tauri::generate_handler![commands::select_download_folder,])
        .setup(|app, api| {
            #[cfg(mobile)]
            let native_utils = mobile::init(app, api)?;
            #[cfg(desktop)]
            let native_utils = desktop::init(app, api)?;
            app.manage(native_utils);
            Ok(())
        })
        .build()
}
