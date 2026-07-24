# Thin wrapper for Fly.io and other platforms that build from this directory.
# Uses the official iroh-dns-server image as the runtime.
#
# The image ENTRYPOINT is the `iroh-dns-server` binary, which takes `-c <path>`.
FROM n0computer/iroh-dns-server:v1.0.0

# Bakes in non-secret config only (domain, ports, rate limits). There are no
# secrets in this file - the discovery server authenticates published packets
# by their own public-key signatures, so it needs no shared token.
COPY config.toml /config/config.toml

# Default image is HTTPS pkarr only (Fly / simple deploys): 443 serves
# PUT/GET /pkarr over TLS; 80 for optional HTTP / ACME.
# For authoritative DNS on a VPS, use config.dns.toml.example and also:
#   EXPOSE 53/udp 53/tcp
# (or publish those ports via docker-compose.dns.yml). Do not enable 53 on Fly.
EXPOSE 80/tcp 443/tcp

CMD ["-c", "/config/config.toml"]
