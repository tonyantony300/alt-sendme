# Self-hosting a DashBeam discovery server (iroh-dns-server)

DashBeam devices find each other by their **public key** using
[pkarr](https://pkarr.org) (Public-Key Addressable Resource Records). By default
this uses n0's public discovery servers. Running your own means device addresses
are published to and resolved from infrastructure you control.

**Recommended default:** the **HTTPS pkarr** path only. Devices `PUT`/`GET`
signed records at `https://<your-domain>/pkarr/<key>` on ports 80/443. An
optional **advanced** path also exposes authoritative DNS (UDP/TCP 53) with
NS delegation so DashBeam can resolve via `DnsAddressLookup` — see
[Advanced: authoritative DNS + NS delegation](#advanced-authoritative-dns--ns-delegation).

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

If you also enabled authoritative DNS (advanced path below), set **DNS origin**
to the same origin domain (e.g. `example.com`) on every device.

> Custom discovery is available on the native apps (desktop / mobile). The web
> build always uses the default public discovery.

## Requirements (HTTPS pkarr — recommended)

- A domain name with an `A`/`AAAA` record pointing at your server (for automatic
  Let's Encrypt TLS). No domain? See the Fly.io no-domain quick test below.
- Ports **443** (HTTPS pkarr) and **80** (optional HTTP / health) reachable.
- Port **53 is not needed** for the simple path.

## Configuration (HTTPS pkarr)

Copy the example and edit the domain + contact:

```bash
cp config.toml.example config.toml
# edit [https].domains and (optionally) letsencrypt_contact
```

Key points in `config.toml`:

- `[https]` is the pkarr endpoint DashBeam talks to (`cert_mode = "lets_encrypt"`
  provisions TLS automatically).
- `[dns]` is **required by the config schema** but bound to loopback and never
  published on the simple path - DashBeam resolves over HTTPS pkarr, so it's
  inert.
- `data_dir = "/data"` holds the signed-packet store and the Let's Encrypt cert
  cache. Mount a volume there so certs survive restarts (avoids LE rate limits).
- `pkarr_put_rate_limit = "smart"` throttles publishing; use `"disabled"` only
  for local testing.

## Option 1: Fly.io (HTTPS pkarr only)

Fly gives you a public IP and volumes with minimal setup.

**Real-DNS (port 53 / NS delegation) is not supported on Fly.** Fly requires
UDP services to bind `fly-global-services` while TCP binds `0.0.0.0`; stock
`iroh-dns-server` cannot do that. Use Docker Compose / a VPS for the advanced
path.

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

## Option 2: Docker Compose (HTTPS pkarr)

```bash
cd infra/dns
cp config.toml.example config.toml
# Edit domains + contact; make sure ports 80 and 443 are free and reachable

docker compose up -d
```

`docker-compose.yml` publishes only 80 + 443 and persists `/data` in a named
volume. TLS is provisioned automatically via Let's Encrypt on first start.

## Advanced: authoritative DNS + NS delegation

Use this when you want DashBeam to resolve peers the same way the default n0
path does: **DNS TXT** lookups via `DnsAddressLookup`, in addition to HTTPS
pkarr. Publish is **still** HTTPS (`PUT /pkarr`); only resolve gains a DNS path.

### When to use it

- You want resolution to work through normal recursive DNS (after NS
  delegation), matching how native default mode queries `dns.iroh.link`.
- You are fine running on a **VPS / Docker Compose** with UDP+TCP **53** open.
- You are **not** deploying on Fly.io.

Leave this off if you only need self-hosted discovery — HTTPS pkarr alone is
enough.

### 1. Server config

```bash
cp config.dns.toml.example config.toml
# Edit: [https].domains, [dns].origins, default_soa, rr_ns, rr_a (/ rr_aaaa)
```

Important `[dns]` keys:

| Key | Role |
| --- | --- |
| `port = 53` | Public authoritative DNS |
| `origins` | Zones under which `_iroh.<z32-id>.<origin>` TXT records are served; include your apex (and usually `"."`) |
| `rr_ns` | Apex NS name this server claims (e.g. `ns1.example.com.`) |
| `rr_a` / `rr_aaaa` | Glue / apex address records for this host |
| `default_soa` | SOA for the zone |

Omit `bind_addr` (or use `0.0.0.0`) so port 53 is reachable. Keep `[https]` —
devices still publish over HTTPS.

### 2. Publish UDP and TCP 53

```bash
docker compose -f docker-compose.yml -f docker-compose.dns.yml up -d
```

The overlay maps `53/udp` + `53/tcp` and adds `NET_BIND_SERVICE`. Ensure the
host firewall allows inbound 53 as well as 80/443.

### 3. Registrar: NS + glue

At the parent zone / registrar for your origin (e.g. `example.com`):

1. **NS** for the origin → `ns1.example.com` (must match `rr_ns` without the
   trailing dot, or as your registrar expects).
2. **Glue** `A` / `AAAA` for `ns1.example.com` → the discovery host’s public
   IP(s) (same addresses as `rr_a` / `rr_aaaa`).
3. Keep (or add) `A` / `AAAA` for the HTTPS hostname used by Let's Encrypt and
   the pkarr URL.

`rr_ns` / `rr_a` only make *this* server’s authoritative answers correct; they
do **not** replace parent-zone delegation.

### 4. DashBeam settings

On **every** device (sender and receiver):

- Discovery mode: **Custom self-hosted**
- Pkarr URL: `https://example.com/pkarr`
- DNS origin: `example.com` (must match an entry in `origins`)

Leaving DNS origin empty keeps HTTPS-only resolve (same as the simple path).

### 5. Verify DNS

In-app **Test connection** only probes HTTPS publish — it does **not** validate
NS. For DNS:

```bash
# Against the server directly (before or after delegation):
dig TXT _iroh.<z32-endpoint-id>.example.com @<server-public-ip>

# After NS delegation has propagated, via public recursion:
dig TXT _iroh.<z32-endpoint-id>.example.com
```

You need a published record first (run a device with custom discovery, or use
Test connection). Replace `<z32-endpoint-id>` with the endpoint’s z-base-32 id.

## Verifying (HTTPS)

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
