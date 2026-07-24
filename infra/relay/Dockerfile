# Thin wrapper for Fly.io and other platforms that build from this directory.
# Uses the official iroh-relay image as the runtime.
FROM n0computer/iroh-relay:v1.0.0

# Bakes in non-secret config only (hostname, contact, limits, access tiers).
# Do NOT put secrets here: the access token belongs in IROH_RELAY_ACCESS_TOKEN
# (e.g. `fly secrets set IROH_RELAY_ACCESS_TOKEN=...`), which overrides the
# config at runtime and never lands in an image layer or a commit.
COPY iroh-relay.conf /config/iroh-relay.conf

EXPOSE 80/tcp 443/tcp 7842/udp 9090/tcp

CMD ["--config-path", "/config/iroh-relay.conf"]
