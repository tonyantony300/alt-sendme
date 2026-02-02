// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .with_target(true)
        .with_thread_ids(true)
        .with_line_number(true)
        .init();

    #[cfg(target_os = "linux")]
    if std::env::var("APPIMAGE").is_ok() {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        tracing::debug!("AppImage detected: Disabling DMABUF for stability.");
    }

    tracing::info!(
        "Starting AltSendme application v{}",
        alt_sendme_lib::get_app_version()
    );

    alt_sendme_lib::run();
}
