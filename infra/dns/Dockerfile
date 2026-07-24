# Thin wrapper for Fly.io and other platforms that build from this directory.
# Uses the official iroh-dns-server image as the runtime.
#
# The image ENTRYPOINT is the `iroh-dns-server` binary, which takes `-c <path>`.
FROM n0computer/iroh-dns-server:v1.0.0

# Bakes in non-secret config only (domain, ports, rate limits). There are no
# secrets in this file - the discovery server authenticates published packets
# by their own public-key signatures, so it needs no shared token.
COPY config.toml /config/config.toml

# HTTPS pkarr only: 443 serves PUT/GET /pkarr over TLS. 80 is kept for optional
# HTTP access / ACME. Port 53 (authoritative DNS) is intentionally NOT published.
EXPOSE 80/tcp 443/tcp

CMD ["-c", "/config/config.toml"]
