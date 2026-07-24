# Self-host an iroh relay for DashBeam

Run your own relay so DashBeam transfers do not use the public iroh relay infrastructure. Relays are stateless connection facilitators — all file data stays end-to-end encrypted.

## Using self-hosted relays with DashBeam

1. Deploy a relay using the assets in this directory (Docker Compose on a VPS or Fly.io).
2. In the app, open **Settings → Network** and choose **Custom self-hosted**.
3. Add your relay URL(s) and optional auth token if you enabled `access.shared_token` on the server.
4. Use **Test connection** to verify registration.

For a fully private setup, configure the same relay URLs on both sender and receiver devices.

### What if only one person uses a self-hosted relay?

Transfers can still work when one side uses custom relays and the other uses the default public relays. Here's the simple version:

**Your relay setting controls where *your* device registers.** When you share a file, the ticket includes *your* relay URL. The other person connects using that ticket — they don't need to match your settings.

| Who shares | Sender uses | Receiver uses | Usually works? |
|------------|-------------|---------------|----------------|
| Alice | Custom (open relay) | Public relays | Yes — receiver reaches Alice via the relay URL in the ticket |
| Alice | Custom (auth token required) | Public relays, no token | Often no — receiver can't authenticate to Alice's private relay |
| Alice | Custom (auth token required) | Same relay + same token | Yes |
| Either side | Any | Any, same LAN or good NAT | Yes — direct peer-to-peer may skip relays entirely |

**Direction matters for privacy, not just connectivity:**

- **You share, they use public relays:** If a relay is needed, traffic may go through *your* relay. They still use public relays for their own device.
- **They share, you use a self-hosted relay:** If a relay is needed, traffic may go through *their* public relay — yours isn't used for that path.

So mixed setups are fine for getting files across, but they're **not fully private** unless both people use the same self-hosted relay(s) (or connect directly without relay fallback).

#### Quick rules of thumb

- **Just want it to work?** An open self-hosted relay (no auth token) is enough; the other person can keep default public relays.
- **Want a private relay?** Both people need your relay URL **and** the auth token in **Settings → Network**.
- **Want zero public relay use?** Both people must set **Custom self-hosted** to the same relay(s).
- **Want no relays at all?** Both people set **Disabled** — only works when a direct connection is possible (e.g. same network).

## Requirements

| Requirement | Details |
|-------------|---------|
| Server | VM or container with a **public IP** |
| DNS | `A` / `AAAA` record for your relay hostname |
| Ports | `80/tcp`, `443/tcp`, `7842/udp` (QUIC address discovery). `9090/tcp` is metrics — keep it **private** (see [Observability](#observability)) |
| TLS | Automatic via Let's Encrypt (built into `iroh-relay`) |

For production, run **at least two relays** in different regions and add both URLs in DashBeam → Settings → Network.

## Option 1: Fly.io

Fly supports UDP and raw ports, which many PaaS providers do not.

[![Deploy on Fly.io](https://img.shields.io/badge/Deploy%20on-Fly.io-4d24f9?logo=flydotio&logoColor=white)](https://fly.io/launch?source=https://github.com/tonyantony300/dashbeam/tree/main/deploy/relay)

```bash
cd deploy/relay
cp iroh-relay.conf.example iroh-relay.conf
# Edit hostname and contact

fly launch --no-deploy
fly volumes create relay_certs --size 1 --region <your-region>
# Private relay only — set the token as a secret, never bake it into the image:
fly secrets set IROH_RELAY_ACCESS_TOKEN=$(openssl rand -hex 32)
fly deploy
```

Update `iroh-relay.conf` so `hostname` matches the DNS name you point at the Fly app.

## Quick deploy to Fly.io (no domain)

For a fast functional test without owning a domain, use `fly.dev.toml`. It runs the relay
in `--dev` mode (plain HTTP on port 3340); Fly's edge terminates TLS and proxies to it, so
the relay is reachable at `https://<app>.fly.dev` with a valid cert.

```bash
cd deploy/relay
# edit fly.dev.toml: set a unique `app` name and a nearby `primary_region`
fly apps create <your-unique-name>
fly deploy --config fly.dev.toml
fly status   # confirm the machine is running
```

Then in DashBeam → **Settings → Network → Custom self-hosted**, add
`https://<your-unique-name>.fly.dev` and click **Test connection**.

> **Caveat:** this mode provides **relaying only** — QUIC address discovery / holepunch
> assist is disabled in `--dev` (it needs direct UDP + TLS). It's ideal for trying the
> feature, not for a production relay. For production, use the Let's Encrypt setup above
> (`fly.toml` + your own domain).

## Option 2: Docker Compose (VPS)

1. Copy and edit the config:

   ```bash
   cd deploy/relay
   cp iroh-relay.conf.example iroh-relay.conf
   # Set hostname, contact email, and review the [limits] block
   ```

   `iroh-relay.conf` is gitignored, so it is safe to keep per-deployment values there. Keep the **access token out of the file** — pass it via the environment instead (see [Private relay](#private-relay-access-control)).

2. Point DNS at your server.

3. Start:

   ```bash
   docker compose up -d
   ```

4. In DashBeam → **Settings → Network**, choose **Custom self-hosted**, add `https://euc1-1.relay.example.com` (see [Region naming](#region-naming-optional-enables-location-flags)), and paste your auth token if you enabled access control.

## Rate limiting 

An open relay with **no caps** lets a single client run up surprise terabyte-scale egress.
`iroh-relay` disables rate limiting entirely when the `[limits]` block is absent, so the
shipped `iroh-relay.conf.example` includes sane defaults:

```toml
[limits]
accept_conn_limit = 100.0   # new connections/sec  (parsed but NOT yet enforced in v1.0.0)
accept_conn_burst = 100     #                       (parsed but NOT yet enforced in v1.0.0)

[limits.client.rx]
bytes_per_second = 1048576  # 1 MiB/s per client, steady state  (enforced)
max_burst_bytes  = 5242880  # 5 MiB burst bucket                (enforced)
```

> **Heads up:** as of `iroh-relay` v1.0.0 the `accept_conn_limit` / `accept_conn_burst`
> connection-rate knobs are accepted by the parser but **not yet implemented** upstream, so
> they currently do nothing. The per-client `[limits.client.rx]` block is the control that
> actually caps bandwidth today — make sure you set it.

Tune these to your hardware and bill tolerance. `bytes_per_second` is required whenever
`max_burst_bytes` is set, and both must be non-zero.

## Private relay (access control)

`access` is a **single** setting — pick at most one tier. With none set, the relay is open
to everyone (`access = "everyone"`).

### Tier 1 — Shared token

Simplest private relay. Prefer the environment variable over the config file so the secret
never lands in an image layer or a commit. When an `access.shared_token` line is present,
`IROH_RELAY_ACCESS_TOKEN` **replaces** it at startup — a placeholder in the file is fine.

In `iroh-relay.conf`:

```toml
access.shared_token = ["placeholder-overridden-by-env"]
```

Then provide the real value out-of-band:

```bash
# Docker Compose (local .env file, gitignored):
echo "IROH_RELAY_ACCESS_TOKEN=$(openssl rand -hex 32)" >> deploy/relay/.env

# Fly.io:
fly secrets set IROH_RELAY_ACCESS_TOKEN=$(openssl rand -hex 32)
```

Use the same value in DashBeam → Settings → Network → **Auth token** on every device.

> Static tokens have no expiry and no per-client revocation — rotating one means updating
> every client. For revocation without restarts, use Tier 3.

### Tier 2 — Endpoint-ID allowlist / denylist

Identity-bound and more granular than a shared secret, with **no token in the app**. Gate by
hex endpoint id:

```toml
access.allowlist = ["<endpoint-id>", "<endpoint-id>"]
# or
access.denylist = ["<endpoint-id>"]
```

### Tier 3 — HTTP callout (recommended for production)

The relay POSTs each connecting endpoint id (header `X-Iroh-NodeId`) to your auth service,
which must reply `200` with the body `true` to allow. This gives you live revocation and
rotation without editing config or restarting:

```toml
access.http.url = "https://auth.example.com/relay-auth"
# Optional bearer token to your auth service (or set IROH_RELAY_HTTP_BEARER_TOKEN):
access.http.bearer_token = "your-callout-token"
```

## Observability

`iroh-relay` serves Prometheus metrics on `:9090` **by default, with no authentication**.
Do not expose this port to the public internet.

- **Docker Compose:** the bundled `docker-compose.yml` binds it to `127.0.0.1:9090` only.
- **Fly.io:** `fly.toml` uses a private `[metrics]` block scraped over Fly's internal
  network instead of a public port.

Scrape it from your own Prometheus (over a private network / VPN / firewall allowlist):

```yaml
scrape_configs:
  - job_name: iroh-relay
    static_configs:
      - targets: ["10.0.0.5:9090"]   # private address of your relay
```

To turn metrics off entirely, set `enable_metrics = false` in `iroh-relay.conf` (and remove
the compose healthcheck, which probes `/metrics`).

For uptime monitoring the relay also serves a built-in **`/healthz`** endpoint (200 + JSON
status) on its main HTTP(S) port — `https://relay.example.com/healthz` in production, or
`http://<host>:3340/healthz` in `--dev` mode.

## Running behind an existing reverse proxy

`iroh-relay`'s Let's Encrypt mode wants ports **80 and 443** for the ACME challenge and TLS,
which collides with an existing Traefik / Caddy / nginx on the same host. Options:

- **Give the relay its own host/IP** (or a dedicated machine) so it owns 80/443. Simplest
  for a production relay; full QUIC hole-punch assist works.
- **Terminate TLS at your proxy** and run the relay in `--dev` mode (plain HTTP on `:3340`),
  exactly like the Fly "no domain" path above. Proxy `https://relay.example.com` →
  `http://127.0.0.1:3340`. **Caveat:** `--dev` disables QUIC address discovery, so you get
  relaying only (no hole-punch assist).

## Non-root and privileged ports

The official image runs as root, which is what lets it bind 80/443. To run unprivileged:

- Grant just the bind capability instead of full root:

  ```yaml
  # docker-compose.yml
  cap_add:
    - NET_BIND_SERVICE
  user: "65532:65532"
  ```

  (Ensure `/data/certs` is writable by that uid.)
- Or run on high ports behind a reverse proxy (see above) so no privileged bind is needed.

## Run as a service (systemd)

To keep the Compose stack running across reboots without Docker's own restart policy, drop
this unit at `/etc/systemd/system/iroh-relay.service`:

```ini
[Unit]
Description=DashBeam iroh-relay
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/dashbeam/deploy/relay
EnvironmentFile=-/opt/dashbeam/deploy/relay/.env
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now iroh-relay
```

## NixOS

No upstream NixOS module exists yet; run the container declaratively with
`virtualisation.oci-containers`:

```nix
{
  virtualisation.oci-containers.containers.iroh-relay = {
    image = "n0computer/iroh-relay:v1.0.0";
    cmd = [ "--config-path" "/config/iroh-relay.conf" ];
    ports = [ "80:80" "443:443" "7842:7842/udp" "127.0.0.1:9090:9090" ];
    volumes = [
      "/etc/iroh-relay/iroh-relay.conf:/config/iroh-relay.conf:ro"
      "iroh-relay-certs:/data/certs"
    ];
    # Keep the token out of the Nix store — load it from an agenix/sops secret:
    environmentFiles = [ "/run/secrets/iroh-relay.env" ];  # IROH_RELAY_ACCESS_TOKEN=...
  };

  networking.firewall.allowedTCPPorts = [ 80 443 ];
  networking.firewall.allowedUDPPorts = [ 7842 ];
}
```

## Verify

After deployment, open DashBeam → Settings → Network → **Test connection**. A successful test confirms the app can register with your relay.

## Troubleshooting

- **ACME / TLS fails**: ensure port 80 is reachable from the internet and DNS points to this host. If something else owns 80/443, see [Running behind an existing reverse proxy](#running-behind-an-existing-reverse-proxy).
- **Test connection times out**: check firewall rules for 443/tcp and 7842/udp.
- **Auth fails**: confirm the effective token (config `access.shared_token` or `IROH_RELAY_ACCESS_TOKEN`) matches the token in the app. Remember the env var **overrides** the file.
- **Relay won't start with a token set**: an empty `IROH_RELAY_ACCESS_TOKEN` (or an empty string in `access.shared_token`) is rejected at startup. Leave the env var unset if you are not using shared-token auth.

## References

- [iroh relay docs](https://docs.iroh.computer/concepts/relays)
- [iroh-relay source](https://github.com/n0-computer/iroh/tree/main/iroh-relay)
- [Official Docker image](https://hub.docker.com/r/n0computer/iroh-relay)

## Region naming (optional, enables location flags)

DashBeam shows a country flag next to a relay URL when the hostname starts with an
AWS/iroh-style region code (e.g. `euc1` → Frankfurt, `use1` → US East, `aps1` → Mumbai).
Following the `https://<region>-<n>.relay.example.com` convention is purely cosmetic and
never required.
