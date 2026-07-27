//! TLS trust helpers for iroh endpoint builders.
//!
//! Desktop native builds use the OS certificate store (`CaTlsConfig::system`) so
//! private CAs installed via the system trust store work with custom HTTPS relays.
//! Wasm and Android leave the builder unchanged (embedded Mozilla roots): Android
//! needs `rustls-platform-verifier` JNI/Gradle setup before OS trust is safe.

use iroh::endpoint::Builder;

/// Apply OS CA trust on desktop native; no-op on wasm32 and Android.
pub fn with_system_ca(builder: Builder) -> Builder {
    #[cfg(not(any(target_arch = "wasm32", target_os = "android")))]
    {
        use iroh::tls::CaTlsConfig;
        builder.ca_tls_config(CaTlsConfig::system())
    }
    #[cfg(any(target_arch = "wasm32", target_os = "android"))]
    {
        builder
    }
}
