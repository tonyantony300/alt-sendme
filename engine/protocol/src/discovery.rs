use crate::types::{get_or_create_secret, DiscoveryModeOption};
use serde::{Deserialize, Serialize};

#[cfg(not(target_arch = "wasm32"))]
use crate::time_compat::{timeout, Duration, Instant};

#[derive(Debug, Clone, Deserialize)]
pub struct DiscoveryConfigArg {
    pub mode: String,
    pub pkarr_relay_url: Option<String>,
    /// Optional DNS origin for real-DNS resolve (`DnsAddressLookup`), e.g. `example.com`.
    /// Empty / omitted keeps HTTPS pkarr resolve only.
    #[serde(default)]
    pub dns_origin: Option<String>,
}

const MAX_DISCOVERY_URL_LENGTH: usize = 2048;
const MAX_DNS_ORIGIN_LENGTH: usize = 253;

#[cfg(not(target_arch = "wasm32"))]
const DISCOVERY_PROBE_TIMEOUT: Duration = Duration::from_secs(15);

fn has_disallowed_discovery_text_char(value: &str) -> bool {
    value
        .chars()
        .any(|char| char.is_control() || char.is_whitespace())
}

fn is_loopback_discovery_host(host: &str) -> bool {
    if host.eq_ignore_ascii_case("localhost") {
        return true;
    }
    host.parse::<std::net::IpAddr>()
        .map(|addr| addr.is_loopback())
        .unwrap_or(false)
}

/// Parse and validate a self-hosted pkarr relay URL (e.g. `https://dns.example.com/pkarr`).
///
/// Mirrors the relay URL validation: HTTPS is required except for loopback hosts,
/// and embedded credentials / whitespace are rejected.
pub fn parse_pkarr_relay_url(url: &str) -> Result<url::Url, String> {
    if url.is_empty() {
        return Err("Discovery (pkarr) URL must not be empty".to_string());
    }
    if url.len() > MAX_DISCOVERY_URL_LENGTH {
        return Err("Discovery (pkarr) URL is too long".to_string());
    }
    if has_disallowed_discovery_text_char(url) {
        return Err(
            "Discovery (pkarr) URL must not contain whitespace or control characters".to_string(),
        );
    }

    let parsed = url::Url::parse(url).map_err(|_| "Invalid discovery (pkarr) URL".to_string())?;

    if parsed.username() != "" || parsed.password().is_some() {
        return Err("Discovery (pkarr) URL must not include a username or password".to_string());
    }

    let host = parsed
        .host_str()
        .ok_or_else(|| "Discovery (pkarr) URL must include a host".to_string())?;

    match parsed.scheme() {
        "https" => Ok(parsed),
        "http" if is_loopback_discovery_host(host) => Ok(parsed),
        "http" => {
            Err("Plain HTTP discovery URLs are only allowed for loopback hosts".to_string())
        }
        _ => Err("Discovery (pkarr) URL scheme must be https or loopback http".to_string()),
    }
}

fn is_valid_dns_origin_label(label: &str) -> bool {
    if label.is_empty() || label.len() > 63 {
        return false;
    }
    let bytes = label.as_bytes();
    if !bytes[0].is_ascii_alphanumeric() || !bytes[bytes.len() - 1].is_ascii_alphanumeric() {
        return false;
    }
    bytes
        .iter()
        .all(|b| b.is_ascii_alphanumeric() || *b == b'-')
}

/// Validate an optional DNS origin domain for `DnsAddressLookup` (e.g. `example.com`).
///
/// Empty / whitespace-only input becomes `None` (HTTPS-only resolve). Rejects
/// URLs, paths, ports, and other non-hostname forms.
pub fn parse_dns_origin(origin: Option<&str>) -> Result<Option<String>, String> {
    let Some(raw) = origin.map(str::trim).filter(|s| !s.is_empty()) else {
        return Ok(None);
    };

    if raw.len() > MAX_DNS_ORIGIN_LENGTH {
        return Err("DNS origin is too long".to_string());
    }
    if has_disallowed_discovery_text_char(raw) {
        return Err("DNS origin must not contain whitespace or control characters".to_string());
    }
    if raw.contains("://") || raw.contains('/') || raw.contains('@') || raw.contains(':') {
        return Err(
            "DNS origin must be a hostname (e.g. example.com), not a URL".to_string(),
        );
    }

    let without_dot = raw.trim_end_matches('.');
    if without_dot.is_empty() {
        return Err("DNS origin must not be empty".to_string());
    }

    // Allow a single bare hostname or dotted domain; reject lone ".".
    if without_dot == "." {
        return Err("DNS origin must be a hostname (e.g. example.com)".to_string());
    }

    if !without_dot
        .split('.')
        .all(is_valid_dns_origin_label)
    {
        return Err("DNS origin contains an invalid hostname label".to_string());
    }

    Ok(Some(without_dot.to_ascii_lowercase()))
}

pub fn build_discovery_mode(arg: Option<DiscoveryConfigArg>) -> Result<DiscoveryModeOption, String> {
    match arg {
        None => Ok(DiscoveryModeOption::Default),
        Some(arg) => match arg.mode.as_str() {
            "default" => Ok(DiscoveryModeOption::Default),
            "custom" => {
                let url = arg
                    .pkarr_relay_url
                    .as_deref()
                    .ok_or_else(|| "A pkarr relay URL is required for custom discovery".to_string())?;
                let pkarr_relay_url = parse_pkarr_relay_url(url)?;
                let dns_origin = parse_dns_origin(arg.dns_origin.as_deref())?;
                Ok(DiscoveryModeOption::Custom {
                    pkarr_relay_url,
                    dns_origin,
                })
            }
            other => Err(format!("Invalid discovery mode: {other}")),
        },
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyDiscoveryResponse {
    pub url: Option<String>,
    pub latency_ms: u64,
}

/// Best-effort reachability check for a custom discovery server. Binds a minimal
/// endpoint that publishes to the configured pkarr relay and waits for the node to
/// come online, mirroring [`crate::relay::verify_relays`].
///
/// This probes HTTPS publish only; it does not validate NS delegation / port 53.
#[cfg(not(target_arch = "wasm32"))]
pub async fn verify_discovery(
    arg: DiscoveryConfigArg,
) -> Result<VerifyDiscoveryResponse, String> {
    use iroh::address_lookup::pkarr::PkarrPublisher;
    use iroh::endpoint::{presets, RelayMode};
    use iroh::Endpoint;

    let mode = build_discovery_mode(Some(arg))?;
    let DiscoveryModeOption::Custom {
        pkarr_relay_url, ..
    } = mode
    else {
        return Err("Discovery verification requires custom discovery mode".to_string());
    };

    let secret_key = get_or_create_secret().map_err(|e| e.to_string())?;

    let endpoint = Endpoint::builder(presets::Minimal)
        .secret_key(secret_key)
        .relay_mode(RelayMode::Default)
        .address_lookup(PkarrPublisher::builder(pkarr_relay_url.clone()))
        .bind()
        .await
        .map_err(|e| format!("Failed to bind endpoint: {e}"))?;

    let started = Instant::now();

    timeout(DISCOVERY_PROBE_TIMEOUT, endpoint.online())
        .await
        .map_err(|_| {
            format!(
                "Timed out waiting for the network to come online ({}s)",
                DISCOVERY_PROBE_TIMEOUT.as_secs()
            )
        })?;

    let latency_ms = started.elapsed().as_millis() as u64;
    endpoint.close().await;

    Ok(VerifyDiscoveryResponse {
        url: Some(pkarr_relay_url.to_string()),
        latency_ms,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_discovery_mode_defaults() {
        let mode = build_discovery_mode(None).expect("none should default");
        assert!(matches!(mode, DiscoveryModeOption::Default));

        let mode = build_discovery_mode(Some(DiscoveryConfigArg {
            mode: "default".to_string(),
            pkarr_relay_url: None,
            dns_origin: None,
        }))
        .expect("default mode should parse");
        assert!(matches!(mode, DiscoveryModeOption::Default));
    }

    #[test]
    fn build_discovery_mode_custom_https() {
        let mode = build_discovery_mode(Some(DiscoveryConfigArg {
            mode: "custom".to_string(),
            pkarr_relay_url: Some("https://dns.example.com/pkarr".to_string()),
            dns_origin: None,
        }))
        .expect("custom https should parse");
        match mode {
            DiscoveryModeOption::Custom {
                pkarr_relay_url,
                dns_origin,
            } => {
                assert_eq!(pkarr_relay_url.as_str(), "https://dns.example.com/pkarr");
                assert!(dns_origin.is_none());
            }
            _ => panic!("expected custom discovery mode"),
        }
    }

    #[test]
    fn build_discovery_mode_custom_with_dns_origin() {
        let mode = build_discovery_mode(Some(DiscoveryConfigArg {
            mode: "custom".to_string(),
            pkarr_relay_url: Some("https://example.com/pkarr".to_string()),
            dns_origin: Some("Example.COM.".to_string()),
        }))
        .expect("custom with origin should parse");
        match mode {
            DiscoveryModeOption::Custom { dns_origin, .. } => {
                assert_eq!(dns_origin.as_deref(), Some("example.com"));
            }
            _ => panic!("expected custom discovery mode"),
        }
    }

    #[test]
    fn build_discovery_mode_custom_requires_url() {
        let err = build_discovery_mode(Some(DiscoveryConfigArg {
            mode: "custom".to_string(),
            pkarr_relay_url: None,
            dns_origin: None,
        }))
        .expect_err("custom without url should fail");
        assert!(err.contains("pkarr relay URL is required"));
    }

    #[test]
    fn build_discovery_mode_rejects_plain_http_non_loopback() {
        let err = build_discovery_mode(Some(DiscoveryConfigArg {
            mode: "custom".to_string(),
            pkarr_relay_url: Some("http://dns.example.com/pkarr".to_string()),
            dns_origin: None,
        }))
        .expect_err("plain http non-loopback should fail");
        assert!(err.contains("loopback"));
    }

    #[test]
    fn build_discovery_mode_allows_loopback_http() {
        let mode = build_discovery_mode(Some(DiscoveryConfigArg {
            mode: "custom".to_string(),
            pkarr_relay_url: Some("http://127.0.0.1:8080/pkarr".to_string()),
            dns_origin: None,
        }))
        .expect("loopback http should parse");
        assert!(matches!(mode, DiscoveryModeOption::Custom { .. }));
    }

    #[test]
    fn build_discovery_mode_rejects_embedded_credentials() {
        let err = build_discovery_mode(Some(DiscoveryConfigArg {
            mode: "custom".to_string(),
            pkarr_relay_url: Some("https://user:pass@dns.example.com/pkarr".to_string()),
            dns_origin: None,
        }))
        .expect_err("embedded credentials should fail");
        assert!(err.contains("username or password"));
        assert!(!err.contains("user:pass"));
    }

    #[test]
    fn build_discovery_mode_rejects_invalid_mode() {
        let err = build_discovery_mode(Some(DiscoveryConfigArg {
            mode: "nope".to_string(),
            pkarr_relay_url: None,
            dns_origin: None,
        }))
        .expect_err("invalid mode should fail");
        assert!(err.contains("Invalid discovery mode"));
    }

    #[test]
    fn parse_dns_origin_rejects_url_forms() {
        let err = parse_dns_origin(Some("https://example.com")).expect_err("url should fail");
        assert!(err.contains("hostname"));

        let err = parse_dns_origin(Some("example.com/pkarr")).expect_err("path should fail");
        assert!(err.contains("hostname"));

        let err = parse_dns_origin(Some("example.com:53")).expect_err("port should fail");
        assert!(err.contains("hostname"));
    }

    #[test]
    fn parse_dns_origin_empty_is_none() {
        assert_eq!(parse_dns_origin(None).unwrap(), None);
        assert_eq!(parse_dns_origin(Some("")).unwrap(), None);
        assert_eq!(parse_dns_origin(Some("   ")).unwrap(), None);
    }
}
