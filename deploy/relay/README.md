# Self-host an iroh relay for AltSendme

Run your own relay so AltSendme transfers do not use the public iroh relay infrastructure. Relays are stateless connection facilitators — all file data stays end-to-end encrypted.

## Requirements

| Requirement | Details |
|-------------|---------|
| Server | VM or container with a **public IP** |
| DNS | `A` / `AAAA` record for your relay hostname |
| Ports | `80/tcp`, `443/tcp`, `7842/udp` (QUIC address discovery), `9090/tcp` (metrics, optional) |
| TLS | Automatic via Let's Encrypt (built into `iroh-relay`) |

For production, run **at least two relays** in different regions and add both URLs in AltSendme → Settings → Network.

## Option 1: Docker Compose (VPS)

1. Copy and edit the config:

   ```bash
   cd deploy/relay
   cp iroh-relay.conf.example iroh-relay.conf
   # Set hostname, contact email, and optionally access.shared_token
   ```

2. Point DNS at your server.

3. Start:

   ```bash
   docker compose up -d
   ```

4. In AltSendme → **Settings → Network**, choose **Custom self-hosted**, add `https://relay.example.com`, and paste your auth token if you enabled `access.shared_token`.

## Option 2: Fly.io

Fly supports UDP and raw ports, which many PaaS providers do not.

[![Deploy on Fly.io](https://fly.io/static/images/deploy-button.svg)](https://fly.io/launch?source=https://github.com/tonyantony300/alt-sendme/tree/main/deploy/relay)

```bash
cd deploy/relay
cp iroh-relay.conf.example iroh-relay.conf
# Edit hostname and contact

fly launch --no-deploy
fly volumes create relay_certs --size 1 --region <your-region>
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

Then in AltSendme → **Settings → Network → Custom self-hosted**, add
`https://<your-unique-name>.fly.dev` and click **Test connection**.

> **Caveat:** this mode provides **relaying only** — QUIC address discovery / holepunch
> assist is disabled in `--dev` (it needs direct UDP + TLS). It's ideal for trying the
> feature, not for a production relay. For production, use the Let's Encrypt setup above
> (`fly.toml` + your own domain).

## Private relay (shared token)

To allow only clients that know your secret, uncomment and set in `iroh-relay.conf`:

```toml
access.shared_token = ["your-long-random-secret"]
```

Use the same value in AltSendme → Settings → Network → **Auth token** on every device.

## Verify

After deployment, open AltSendme → Settings → Network → **Test connection**. A successful test confirms the app can register with your relay.

## Troubleshooting

- **ACME / TLS fails**: ensure port 80 is reachable from the internet and DNS points to this host.
- **Test connection times out**: check firewall rules for 443/tcp and 7842/udp.
- **Auth fails**: confirm `access.shared_token` on the server matches the token in the app.

## References

- [iroh relay docs](https://docs.iroh.computer/concepts/relays)
- [iroh-relay source](https://github.com/n0-computer/iroh/tree/main/iroh-relay)
- [Official Docker image](https://hub.docker.com/r/n0computer/iroh-relay)
