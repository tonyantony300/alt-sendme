# DashBeam self-hosting infrastructure

DashBeam works out of the box using n0's public iroh infrastructure. If you want
transfers to rely only on servers **you** control, you can self-host either or
both of the two independent pieces:

| Service | What it does | Directory |
| --- | --- | --- |
| **Relay** | Forwards encrypted packets and helps with NAT hole-punching when a direct connection isn't possible. | [`relay/`](relay/README.md) |
| **Discovery** | Maps a device's public key → its current address (pkarr), so peers can find each other by id. | [`dns/`](dns/README.md) |

These are **separate concerns** - you can self-host one, both, or neither:

- Self-host the **relay** only: your packets route through your relay, but
  devices are still discovered via n0's public servers.
- Self-host **discovery** only: device addresses are published/resolved on your
  server, but fallback packet forwarding still uses public relays.
- Self-host **both** for a fully private stack.

## Privacy model

- Transfers are always **end-to-end encrypted**; neither a relay nor a discovery
  server can read your files.
- A relay only sees encrypted packets it forwards. A discovery server only
  stores small, self-signed address records.
- Discovery records are **self-authenticating** (signed by each device's key), so
  the discovery server needs no shared secret. A relay may optionally require a
  shared token - see its README.

## Configuring DashBeam

Both services are configured in the app under **Settings → Infra**:

- **Relay** subsection → point at your relay URL(s). See
  [`relay/README.md`](relay/README.md).
- **Discovery** subsection → point at your discovery (pkarr) URL. See
  [`dns/README.md`](dns/README.md).

For a private setup, configure the **same** relay and/or discovery settings on
**both** the sending and receiving devices - a publisher and a resolver must
agree on where records live, and both peers must be able to reach the relay.

> Custom relay and discovery are available on the native apps (desktop /
> mobile). The web build always uses the default public infrastructure.

## Deployment targets

Each service ships ready-to-use assets:

- **Fly.io** (`fly.toml`, plus a no-domain `fly.dev.toml` quick test)
- **Docker Compose** (`docker-compose.yml`)
- A thin **Dockerfile** wrapping the official pinned image

See each service's README for step-by-step instructions.
