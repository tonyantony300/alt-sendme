//! TLS trust helpers for iroh endpoint builders.
//!
//! Native builds use the OS certificate store (`CaTlsConfig::system`) so private
//! CAs installed via the system trust store work with custom HTTPS relays.
//! Wasm leaves the builder unchanged (browser / embedded roots).

use iroh::endpoint::Builder;

/// Apply OS CA trust on native; no-op on wasm32.
pub fn with_system_ca(builder: Builder) -> Builder {
    #[cfg(not(target_arch = "wasm32"))]
    {
        use iroh::tls::CaTlsConfig;
        builder.ca_tls_config(CaTlsConfig::system())
    }
    #[cfg(target_arch = "wasm32")]
    {
        builder
    }
}
