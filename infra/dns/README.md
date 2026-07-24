# Self-hosting a DashBeam discovery server (iroh-dns-server)

DashBeam devices find each other by their **public key** using
[pkarr](https://pkarr.org) (Public-Key Addressable Resource Records). By default
this uses n0's public discovery servers. Running your own means device addresses
are published to and resolved from infrastructure you control.

This directory ships the **HTTPS pkarr** path only: devices `PUT`/`GET` signed
records at `https://<your-domain>/pkarr/<key>`. There is **no authoritative-DNS
(port 53) / NS-delegation** setup - that advanced path is intentionally left out
so a discovery server is a single-container, ports-80/443 deployment.

## What discovery does (and does not) do

- **Discovery** maps a device's public key → its current addresses (home relay,
  and optionally direct IPs). It's how a receiver finds a sender when the ticket
  only carries an endpoint id.
- Discovery is **separate from relays**. Relays forward encrypted packets;
  discovery just answers "where is key X right now?". You can self-host one,
  both, or neither. For a fully private stack, self-host both (see
  [`../relay/`](../relay/README.md)).
- Records are **self-authenticating**: every packet is signed by the publishing
  device's key. The server therefore needs **no shared secret / auth token** -
  anyone may publish their own record, nobody can forge someone else's.
- Your files never touch the discovery server; it only stores small signed
  address records. Transfers stay end-to-end encrypted.

## Using a self-hosted discovery server with DashBeam

In DashBeam go to **Settings → Infra → Discovery**, choose **Custom
self-hosted**, and set the pkarr URL to:

```
https://<your-domain>/pkarr
```

For discovery to work end-to-end, **both** the sender and receiver must point at
the same discovery server (a publisher and a resolver have to agree on where
records live). Mixing a custom discovery server on one side with the default on
the other will not resolve.

> Custom discovery is available on the native apps (desktop / mobile). The web
> build always uses the default public discovery.

## Requirements

- A domain name with an `A`/`AAAA` record pointing at your server (for automatic
  Let's Encrypt TLS). No domain? See the Fly.io no-domain quick test below.
- Ports **443** (HTTPS pkarr) and **80** (optional HTTP / health) reachable.
- Port **53 is not needed** and is not published.

## Configuration

Copy the example and edit the domain + contact:

```bash
cp config.toml.example config.toml
# edit [https].domains and (optionally) letsencrypt_contact
```

Key points in `config.toml`:

- `[https]` is the pkarr endpoint DashBeam talks to (`cert_mode = "lets_encrypt"`
  provisions TLS automatically).
- `[dns]` is **required by the config schema** but bound to loopback and never
  published - DashBeam resolves purely over HTTPS pkarr, so it's inert.
- `data_dir = "/data"` holds the signed-packet store and the Let's Encrypt cert
  cache. Mount a volume there so certs survive restarts (avoids LE rate limits).
- `pkarr_put_rate_limit = "smart"` throttles publishing; use `"disabled"` only
  for local testing.

## Option 1: Fly.io

Fly gives you a public IP and volumes with minimal setup.

[![Deploy on Fly.io](https://img.shields.io/badge/Deploy%20on-Fly.io-4d24f9?logo=flydotio&logoColor=white)](https://fly.io/launch?source=https://github.com/tonyantony300/dashbeam/tree/main/infra/dns)

```bash
cd infra/dns
cp config.toml.example config.toml
# Edit domains + contact

fly launch --no-deploy
fly volumes create discovery_data --size 1 --region <your-region>
fly deploy
```

Then point `dns.example.com` at the app's IP (`fly ips list`) and set DashBeam's
discovery URL to `https://dns.example.com/pkarr`.

## Quick deploy to Fly.io (no domain)

To try discovery without owning a domain, use `fly.dev.toml`. Fly's edge
terminates TLS at `https://<app>.fly.dev` and proxies to a plain-HTTP listener
inside the container.

```bash
cd infra/dns
cp config.toml.example config.toml
# In config.toml: set [http] port = 8080 and comment out the whole [https] block

fly apps create --generate-name        # or: fly apps create my-discovery
# set `app` in fly.dev.toml to that name, then:
fly deploy --config fly.dev.toml
```

Discovery URL = `https://<app>.fly.dev/pkarr`.

## Option 2: Docker Compose

```bash
cd infra/dns
cp config.toml.example config.toml
# Edit domains + contact; make sure ports 80 and 443 are free and reachable

docker compose up -d
```

`docker-compose.yml` publishes only 80 + 443 and persists `/data` in a named
volume. TLS is provisioned automatically via Let's Encrypt on first start.

## Verifying

- In DashBeam, **Settings → Infra → Discovery → Test connection** publishes a
  record to your server and reports latency.
- Manually, a `GET https://<your-domain>/healthcheck` returns `OK`, and
  `GET https://<your-domain>/healthz` returns JSON status.

## Observability

The server exposes Prometheus metrics (no auth) on `127.0.0.1:9117` by default.
To scrape it, set an explicit `[metrics] bind_addr` in `config.toml` and expose
it only on a trusted network (see the commented block in `config.toml.example`
and `fly.toml`).

## A fully private stack

Self-host **both** a relay and a discovery server, and configure both on every
device:

- Relay: [`../relay/README.md`](../relay/README.md) → Settings → Infra → Relay
- Discovery: this server → Settings → Infra → Discovery

With both set (and matching on sender + receiver), DashBeam transfers use only
infrastructure you control, end to end.
