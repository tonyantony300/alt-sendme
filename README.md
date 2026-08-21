**Language:** English | [中文](docs/readme/README.zh-CN.md) | [Русский](docs/readme/README.ru.md) | [Português](docs/readme/README.pt-BR.md) | [Español](docs/readme/README.es.md) | [Deutsch](docs/readme/README.de.md) | [Français](docs/readme/README.fr.md) | [日本語](docs/readme/README.ja.md) | [한국어](docs/readme/README.ko.md) | [Polski](docs/readme/README.pl.md) | [العربية](docs/readme/README.ar.md)

<div align="center">

# File transfer doesn't need to be complicated

</div>


![DashBeam Header](assets/header.png)

<div align="center">

![DashBeam working demo](assets/demo.gif)

</div>

<div align="center">


[![Discord][badge-discord]](https://discord.gg/xwb7z22Eve)
[![Version][badge-version]](https://github.com/tonyantony300/dashbeam/releases/latest)
![Website][badge-website]
![Platforms][badge-platforms]
[![Sponsor][badge-sponsor]](https://github.com/sponsors/tonyantony300)



</div>

A free and open-source file transfer tool that harnesses the power of [cutting-edge peer-to-peer networking](https://www.iroh.computer), letting you transfer files directly without storing them on cloud servers.

Why rely on WeTransfer, Dropbox, or Google Drive when you can reliably and easily transfer files directly, end-to-end encrypted and without revealing any personal information?

Pick whichever route is closest to hand: **send a link or a QR code** that opens on any device, **send to a device you paired once**, or **send to a device already on your network**. All three move the same bytes the same way — directly, encrypted end to end.



## Features

**Reach**

- **Send anywhere, from anything** - Desktop, Android, terminal, or browser - start on one platform, receive on any other. On Android, DashBeam sits in the system Share sheet too, so you can send straight from Gallery or Files.
- **Transfer anything, any size** - Files or entire directories, verified end-to-end with BLAKE3 integrity checks.
- **Fast enough to matter** - Saturates multi-gigabit connections for lightning-fast transfers.

**Three ways to send**

- **Share a link or a QR code** - Every share mints a receive link and a QR code alongside the ticket. Scan it with a phone camera or drop the link into any chat: on Android it opens the app directly, everywhere else it opens in the browser, so the person receiving doesn't need DashBeam installed.
- **Paired devices** - Pair computers and Android phones once in **Settings → Devices**, then send files without copying tickets each time.
- **Nearby on the same network** - Other DashBeam devices on your LAN show up automatically (mDNS). Pair and send in a single step - no code to type, no ticket to paste.

**Private and secure**

- **Private by default** - No accounts, no sign-ups, no tracking, no ads.
- **Direct device-to-device transfer** - Files move directly between your devices, avoiding corporate cloud storage where data is the price.
- **End-to-end encryption, always on** - Every transfer uses QUIC with TLS 1.3; relays only see encrypted traffic even if they are involved.
- **Cryptographic authentication** - Every ticket verifies you're connected to the intended sender before any files transfer.
- **You decide who can see you** - Local discoverability is a setting, not a default: everyone, paired devices only, or off.

**Day to day**

- **Resumable & broadcastable** - Interrupted transfers resume automatically; share the same file with any number of peers at once.
- **Preview before you download** - See what you're receiving before you download it.
- **Transfer history** - A local record of what you sent and received, with speeds, timings, and where the files landed. Reclaim disk from interrupted downloads, or switch recording off entirely.
- **Background presence** - Stay reachable from the tray, the menu bar, or an Android background service, and optionally start at login, so paired devices see you online.
- **System notifications** - Pair requests and file invites can raise OS notifications when the app isn't in the foreground (desktop and Android).
- **Featherlight** - Tiny installs, minimal web footprint.
- **Free & open source** - No upload costs, no size limits, community-driven.


## Real-world stats


| Metric | Reported |
|--------|--------|
| **Largest transfer** | 452 GB |
| **Fastest large transfer** | 54 GB @ 123 MB/s (~1 Gbps) |
| **High-speed bulk transfer** | 328 GB @ 93 MB/s |
| **Peak speed measured** | 125 MB/s (1 Gbps) |

*Transfer throughput depends on your device, network, and connection path.*



## Installation

The easiest way to get started is by downloading one of the following versions for your respective operating system:

<table>
  <tr>
    <td><b>Platform</b></td>
    <td><b>Recommended</b></td>
    <td><b>Other formats</b></td>
    <td><b>Size</b></td>
  </tr>
  <tr>
    <td>💻 <b>Windows (x64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_x64-setup.exe'>Setup.exe</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_x64_en-US.msi'>MSI</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_x64-portable.zip'>Portable ZIP</a></td>
    <td>~10 MB</td>
  </tr>
  <tr>
    <td>💻 <b>macOS (Universal)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_universal.dmg'>DashBeam.dmg</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_aarch64.dmg'>Apple Silicon</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_x64.dmg'>Intel</a></td>
    <td>~15 MB</td>
  </tr>
  <tr>
    <td>💻 <b>Linux (amd64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_amd64.deb'>DashBeam.deb</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam-0.7.0-1.x86_64.rpm'>.rpm</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam_0.7.0_amd64.AppImage'>AppImage</a></td>
    <td>~13 MB</td>
  </tr>
  <tr>
    <td>📱 <b>Android (arm64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam-v0.7.0-arm64.apk'>DashBeam.apk</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam-v0.7.0-armv7.apk'>armv7</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.7.0/DashBeam-v0.7.0-universal.apk'>universal</a></td>
    <td>~50 MB</td>
  </tr>
  <tr>
    <td>⌨️ <b>CLI</b></td>
    <td><a href='https://www.dashbeam.net/en/downloads'>Downloads</a></td>
    <td>-</td>
    <td>~4-5 MB</td>
  </tr>
  <tr>
    <td>🌐 <b>Web (Limited throughput)</b></td>
    <td><a href='https://app.dashbeam.net'>app.dashbeam.net</a></td>
    <td>-</td>
    <td>~2 MB</td>
  </tr>
</table>

More options at [GitHub Releases](https://github.com/tonyantony300/dashbeam/releases) or in [Downloads](https://www.dashbeam.net/en/downloads) page.

Running into problems? See [Troubleshooting](docs/troubleshooting.md) for common issues and how to collect logs.



## Partners

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg">
    <img src="https://www.dashbeam.net/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

We're looking for Partners to join our mission! Partner with us and support while we push the boundaries of peer-to-peer file transfer.

[**LET'S CHAT**](https://www.dashbeam.net/en/contact)


## Supported Languages
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭 🇺🇿

 
## How it works 

1. Drop your file or folder - DashBeam starts sharing it and creates a one-time share code (a "ticket"), plus a receive link and a QR code that carry it.
2. Get it to the other side however suits the moment: send the link, let them scan the code, paste the raw ticket into a chat, **or** pick a paired or nearby device and send straight to it (desktop / Android).
3. They open the link, scan the code, paste the ticket, or accept the invite - and the transfer begins.

Keep the app open while others download. The files never leave your device for a server, so there is nothing left to fetch once you close it.

### Share a link or QR code

While you are sharing, the ticket sits next to three buttons:

- **QR** shows the receive link as a code to point a phone camera at.
- **Share** opens the system share sheet wherever there is one — Android, and mobile browsers — and copies the link everywhere else.
- **Copy** copies the raw ticket, for when the other side already has DashBeam open.

The link is an ordinary `https://app.dashbeam.net/receive?ticket=…` URL. On Android it is a verified App Link, so it opens the installed app on the receive tab with the ticket already filled in. Anywhere else it opens the web app in a browser, which means **the person receiving does not have to install anything** — though browser transfers are relayed and throttled, so reach for the app when the files are large.

The receive box is forgiving about what you paste into it: a bare ticket, a receive link, or the whole share message with the link buried in it all work.

### Paired devices

On macOS, Windows, Linux, and Android you can pair devices in **Settings → Devices** using a pairing code, or by accepting a Nearby pair request on the same local network. After pairing:

- Senders can tap **Send** next to a paired device while sharing: no manual ticket copy.
- Receivers get an in-app prompt when a paired sender invites them; with system notifications enabled, they can also get an OS banner when the window isn't focused.
- On desktop, the tray / menu bar can show which paired devices are online, and DashBeam can stay running after you close the window (**Settings → General → Startup & background**).
- On Android, a background service keeps the device reachable while the app is out of the foreground. It starts itself only when there is presence worth holding — a connectable paired device, or discoverability switched on — and stops when there isn't.
- Manual tickets and the [sendme CLI](https://www.iroh.computer/sendme) still work exactly as before.

### Nearby devices

When other DashBeam apps are on the same Wi-Fi or LAN, they can appear under **Nearby** in **Settings → Devices** and in the **Send to a device** sheet while sharing:

- **Pair** from Settings to add a device without exchanging a pairing code.
- **Send** from the share sheet to invite a Nearby device with the current ticket. Unpaired devices are listed there as **Pair & Send**: one accept both pairs the devices and starts the transfer.
- First contact shows a short verification code on both screens, so each side can confirm who they are talking to before accepting.
- Control whether others can find you under **Settings → Network → Your discoverability** (Everyone / Paired only / Off).

Nearby relies on [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS). If your network blocks multicast (guest Wi-Fi, many VPNs), use a manual ticket or pair over the internet instead—see [Troubleshooting](docs/troubleshooting.md#the-nearby-list-is-empty).

### Transfer history

Desktop and Android keep a local record of transfers, reachable from **History**:

- Sends and receives share one chronological list; each row shows the direction, the device on the other end, how many items moved, and how big they were.
- Expand a row for the details that actually explain a transfer: time on the wire, average speed, time spent writing to disk, where the files were saved, how many were renamed to avoid overwriting something, and what went wrong if it failed.
- Filter by Completed, Failed, Cancelled, or Interrupted.
- Interrupted downloads leave a partial store behind so they can resume. History shows how much space that is and lets you reclaim it without losing the row.
- Recording is a toggle in **Settings → General**, and you can remove single rows or clear the list. None of it leaves your device.


## Comparison

| | **DashBeam** | **Blip** | **LocalSend** | **Magic Wormhole** | **PairDrop** |
|:---|:---:|:---:|:---:|:---:|:---:|
| Networking stack | QUIC via Iroh | Unknown | HTTPS/REST over TCP | encrypted TCP | WebRTC/DTLS (SCTP) |
| Works over the internet | ✅ | ✅ | LAN only | ✅ | ✅ |
| Saturates gigabit connections | ✅ | ✅ | ✅ (LAN only) | ✅ | ❌ (SCTP/browser ceiling) |
| Open source | ✅ | ❌ | ✅ | ✅ | ✅ |
| No account required | ✅ | ❌ | ✅ | ✅ | ✅ |
| End-to-end encryption | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send folders | ✅ | ✅ | ✅ | ✅ | ✅ (CLI only, not in browser) |
| Resumable transfers | ✅ | ✅ | ❌ | ❌ | ❌ |
| Unlimited file size | ✅ | ✅ | ✅ | ✅ | Limited by browser memory |
| Platforms | CLI + desktop + mobile + web | Desktop + mobile (no web/CLI) | Desktop + mobile (no web/CLI) | CLI only | Web/PWA + Android app + CLI |
| Discover devices on LAN | ✅ | ❌ | ✅ | ❌ | ✅ |
| The catch | WIP | Closed source; data handling cannot be audited | Same-network only, no resume | CLI-only; GUI front-ends are separate, community-maintained | WebRTC/SCTP throughput ceiling; browser memory limits |

[Know more →](https://www.dashbeam.net/en/compare)

## Under the hood

DashBeam is built on [Iroh](https://www.iroh.computer), a modern peer-to-peer networking stack that simplifies direct device-to-device communication. In practice, that means devices talk over encrypted QUIC, files move with content-addressed blobs, and relays help when a direct path isn’t available.

> **The long version:** [Under the hood](https://dashbeam.net/en/under-the-hood) walks the same architecture as a narrative — fingerprints instead of filenames, names instead of addresses, hole punching, roaming, and what each intermediary can and cannot see.

### The building blocks

| Piece | What it does here |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | Store and stream file data; every chunk is verified with BLAKE3 |
| **Tickets** | One string that tells a peer *who* to dial and *what* to fetch |
| **Endpoints** | Each device’s Iroh identity (Ed25519 key → endpoint id) |
| **QUIC + TLS 1.3** | Encrypted transport; multiplexing without head-of-line blocking |
| **Relays + hole punching** | Bootstrap connections across NATs; the relay carries data while a direct path is negotiated |
| **Control protocol** (pairing) | Long-lived channel to remember devices and deliver share invites |
| **Local discovery** (mDNS) | Optional LAN advertising so Nearby devices can find each other without a ticket |
| **Receive links** | A ticket wrapped in an ordinary https URL — an App Link on Android, the web app everywhere else |

### Blobs

Files aren’t uploaded to a server. They’re published as **blobs**: opaque byte sequences addressed by a BLAKE3 hash.

- A **link** is that 32-byte hash: if the hash matches, the content matches.
- Folders and large files use a **HashSeq** (a blob that points at other blobs).
- The sender is the **provider**; the receiver is the **requester**. Either side can do both.

Because that hash is a BLAKE3 tree rather than one digest over the whole file, every chunk verifies on its own against the root. That is what makes resume cheap: a receiver coming back after a dropped connection knows exactly which chunks it already holds *and has verified*, so it asks only for the gap. Nothing already received is re-sent, and nothing arriving is taken on trust.

### Tickets

A share **ticket** is a single token that packs:

1. The sender’s endpoint id (so you know you’re talking to the right device)
2. Enough address / relay info to dial them
3. The blob hash to download

You only connect to people you share a ticket with: no broadcasting your IP to strangers. That’s the default “cozy network” model Iroh encourages, vs. flooding discovery to the whole swarm.

Tickets that carry only an endpoint id lean on public-key discovery (Pkarr) to find current addresses. Those records are signed by the endpoint key itself, so a tampered one fails verification rather than misdirecting you — the lookup service is trusted for **availability, not integrity**.

### Receive links and QR codes

A receive link is a thin wrapper around a ticket:

```
https://app.dashbeam.net/receive?ticket=<ticket>
```

The QR code encodes that same URL and nothing else. DashBeam ships no camera scanner of its own — you point whatever camera you already have at the code, and the phone opens the link.

Because the ticket rides in the URL, **the link carries exactly the authority the ticket does**: anyone holding it can fetch that share until you stop sharing. Two consequences worth knowing:

- Treat the link like the ticket. Send it over a channel you would trust with the files themselves.
- The ticket sits in the query string, so whoever serves that page sees it as well as the person you sent it to. The payload never touches them — but if even that is too much, share the raw ticket instead, or point a self-hosted web build at your own domain and the app will mint links there.

On Android, `app.dashbeam.net/receive` is registered as a verified App Link, so the installed app intercepts the link before a browser can. Elsewhere the URL opens the static web app, which reads the ticket out of the query string in the browser and dials the sender peer-to-peer from there.

### Connecting across networks

When two devices need to meet:

1. Each registers with a public (or self-hosted) **relay** so peers can find a path through firewalls and NATs.
2. Iroh tries **QUIC hole punching** to upgrade to a direct peer-to-peer link.
3. If a direct path works, traffic moves over to it. If not, the relay stays in the path as a fallback UDP hop.

Those steps overlap rather than queue. The relay is already carrying your data while hole punching negotiates, so nothing waits on the direct path to succeed — the transfer just gets faster if and when it does. Roughly one transfer in ten never gets a direct path at all (symmetric NAT, locked-down corporate networks) and rides the relay start to finish.

Either way, the payload is end-to-end encrypted. Relays see ciphertext, not your files. [More on Iroh relays →](https://docs.iroh.computer/about/faq)

### Roaming across networks

A connection is bound to the peer’s key, not to its IP address, so changing networks does not end it. Switch from Wi-Fi to cellular mid-transfer and iroh notices the address change, learns the new candidates, and republishes them to the peer. The relay carries the data throughout, and hole punching simply runs again on the new path.

Addresses are disposable hints, not identity. That is the practical payoff of naming devices by key instead of by location.

### QUIC & encryption

QUIC (UDP-based, same foundation as HTTP/3) brings TLS 1.3 into the transport. For DashBeam that buys encryption and authentication, multiple streams with shared congestion control, and fast reconnects when you’ve talked to a peer before.

### Paired devices

Pairing doesn’t replace tickets; it delivers them for you.

1. Devices exchange a short **pairing code** (the host’s endpoint id) over a dedicated control ALPN.
2. Each side proves identity by signing connection-bound keying material with its device secret, then remembers the peer locally.
3. A persistent control connection keeps presence (online/offline).
4. When you share, DashBeam still creates a normal one-time blob ticket; choosing a paired device ships that ticket as an in-app **invite** instead of making you copy-paste it.

Manual tickets and the [sendme CLI](https://www.iroh.computer/sendme) keep working exactly as before.

### Nearby (local discovery)

On the same local network, DashBeam can advertise and browse peers with mDNS (desktop and Android; not the web app).

1. When discoverability is **Everyone**, the device publishes enough metadata for others to show its name in Nearby.
2. **Paired only** still announces presence without exposing the display name to strangers on the LAN.
3. **Off** stops advertising; you can still browse and send to others who remain discoverable.
4. First-contact file invites show a short verification code derived from both devices' public keys so each side can confirm they're talking to the intended peer before accepting.
5. Accepting a Nearby pair request or file invite creates the same local paired-device records as code-based pairing.

### Self-hosting relays and discovery

For how to run your own iroh relay and discovery server, configure DashBeam to use them, and how mixed public/self-hosted setups behave, see [`infra/README.md`](infra/README.md) (relay: [`infra/relay/README.md`](infra/relay/README.md#using-self-hosted-relays-with-dashbeam), discovery: [`infra/dns/README.md`](infra/dns/README.md)).

For the illustrated version of everything above — including a full account of what a relay operator, your ISP, and the lookup service each learn from a transfer — read [Under the hood](https://dashbeam.net/en/under-the-hood).


## Development

See [CONTRIBUTING.md](CONTRIBUTING.md#development-setup) for prerequisites, local setup, build instructions, and testing.

## Join our [Discord](https://discord.gg/xwb7z22Eve) to contribute

The best way to contribute is to join our Discord and say hi. Introduce yourself and share what skills or interests you have - whether that’s coding, testing, design, or something else. You can also raise issues, suggest fixes, or pitch ideas. Maintainers are there to guide you every step of the way.

It’s the best place to get context, align on direction, and collaborate with the [community](https://discord.gg/xwb7z22Eve).

## License

AGPL-3.0

## Privacy Policy

See [PRIVACY.md](PRIVACY.md) for information about how DashBeam handles your data and privacy.

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## Contributors

<a href="https://github.com/tonyantony300/dashbeam/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/dashbeam" />
</a>


## Contact

Reach me [here](https://www.dashbeam.net/en/contact) for suggestions, feedback or media related communication.


Thank you for checking out this project! If you find it useful, consider giving it a star and helping spread the word.




## Built on

<div align="left">
  <a href="https://iroh.computer">
    <img alt="iroh" src="https://raw.githubusercontent.com/n0-computer/iroh/main/.img/iroh_wordmark.svg" width="200">
  </a>
</div>




<!-- <div align="center" style="color: gray;"></div> -->

[badge-website]: https://img.shields.io/badge/website-dashbeam.net-orange
[badge-version]: https://img.shields.io/badge/version-0.7.0-blue
[badge-discord]: https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20CLI%2C%20-green
[badge-sponsor]: https://img.shields.io/badge/sponsor-ff69b4


