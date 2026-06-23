# Thin wrapper for Fly.io and other platforms that build from this directory.
# Uses the official iroh-relay image as the runtime.
FROM n0computer/iroh-relay:latest

COPY iroh-relay.conf /config/iroh-relay.conf

EXPOSE 80/tcp 443/tcp 3478/udp 9090/tcp

CMD ["--config-path", "/config/iroh-relay.conf"]
