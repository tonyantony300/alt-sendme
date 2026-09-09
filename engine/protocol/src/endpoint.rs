//! Shared iroh endpoint construction.

use iroh::{
    endpoint::{presets, Builder, RelayMode},
    Endpoint, SecretKey,
};

const IROH_SERVICES_RELAYS: [&str; 4] = [
    "https://e3qdnz19n5p4tnh6b.euc1.relay.iroh-svc.com/",
    "https://e3qdnz19n5p4tnh6b.use1.relay.iroh-svc.com/",
    "https://e3qdnz19n5p4tnh6b.usw1.relay.iroh-svc.com/",
    "https://e3qdnz19n5p4tnh6b.aps1.relay.iroh-svc.com/",
];

const IROH_SERVICES_API_SECRET: &str =
    "servicesaaqizynrq3pdxtwxnnrlcxg5rpezbcpthntqlwpxc5oren2557x6nkgjlxfzhaykym52alh56n2vwg5b5sme5k2r3ez6rbuyevxwsx2cgeaa";

/// Build an endpoint with the configured iroh-services relays for the app's
/// default relay mode. Explicit custom and disabled modes retain their prior
/// behavior.
///
/// `default_discovery` controls whether the n0 address lookup installed by the
/// preset is retained. Self-hosted discovery callers clear it before adding
/// their own lookup services.
pub fn endpoint_builder(
    secret_key: SecretKey,
    relay_mode: &RelayMode,
    default_discovery: bool,
) -> anyhow::Result<Builder> {
    let builder = match relay_mode {
        RelayMode::Default => {
            // The preset derives relay authorization from the endpoint key, so
            // the key must be supplied before the preset is built.
            let preset = iroh_services::preset()
                .relays(IROH_SERVICES_RELAYS)?
                .api_secret_from_str(IROH_SERVICES_API_SECRET)?
                .secret_key(secret_key)
                .build()?;
            Endpoint::builder(preset)
        }
        _ => {
            let builder = if default_discovery {
                Endpoint::builder(presets::N0)
            } else {
                Endpoint::builder(presets::Minimal)
            };
            builder
                .secret_key(secret_key)
                .relay_mode(relay_mode.clone())
        }
    };

    Ok(if default_discovery {
        builder
    } else {
        builder.clear_address_lookup()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn iroh_services_configuration_is_valid() {
        endpoint_builder(SecretKey::generate(), &RelayMode::Default, true)
            .expect("iroh-services relays and API secret should be valid");
    }
}
