<img src="assets/rename-banner.svg" alt="Announcement: AltSendme is now DashBeam. Same app, easier to find, remember and pronounce." width="1200" />

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



## Features

- **Send anywhere, from anything** - Desktop, Android, terminal, or browser - start on one platform, receive on any other.
- **Transfer anything, any size** - Files or entire directories, verified end-to-end with BLAKE3 integrity checks.
- **Fast enough to matter** - Saturates multi-gigabit connections for lightning-fast transfers.
- **Private by default** - No accounts, no sign-ups, no tracking, no ads. 
- **Direct device-to-device transfer** - Files move directly between your devices, avoiding corporate cloud storage where data is the price.
- **End-to-end encryption, always on** - Every transfer uses QUIC with TLS 1.3; relays only see encrypted traffic even if they are involved.
- **Cryptographic authentication** - Every ticket verifies you're connected to the intended sender before any files transfer.
- **Resumable & broadcastable** - Interrupted transfers resume automatically; share the same file with any number of peers at once.
- **Preview before you download** - See what you're receiving before you download it.
- **Paired devices** - Pair computers and Android phones once in **Settings → Devices**, then send files without copying tickets each time.
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
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_x64-setup.exe'>Setup.exe</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_x64_en-US.msi'>MSI</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_x64-portable.zip'>Portable ZIP</a></td>
    <td>~10 MB</td>
  </tr>
  <tr>
    <td>💻 <b>macOS (Universal)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_universal.dmg'>DashBeam.dmg</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_aarch64.dmg'>Apple Silicon</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_x64.dmg'>Intel</a></td>
    <td>~15 MB</td>
  </tr>
  <tr>
    <td>💻 <b>Linux (amd64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_amd64.deb'>DashBeam.deb</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme-0.6.0-1.x86_64.rpm'>.rpm</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme_0.6.0_amd64.AppImage'>AppImage</a></td>
    <td>~13 MB</td>
  </tr>
  <tr>
    <td>📱 <b>Android (arm64)</b></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme-v0.6.0-arm64.apk'>DashBeam.apk</a></td>
    <td><a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme-v0.6.0-armv7.apk'>armv7</a>, <a href='https://github.com/tonyantony300/dashbeam/releases/download/v0.6.0/AltSendme-v0.6.0-universal.apk'>universal</a></td>
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
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭

 
## How it works 

1. Drop your file or folder - DashBeam creates a one-time share code (called a "ticket").
2. Share the ticket via chat, email, or text, **or** send directly to a paired device (desktop / Android).
3. Your friend pastes the ticket in their app (or accepts a paired-device invite), and the transfer begins.

### Paired devices

On macOS, Windows, Linux, and Android you can pair devices in **Settings → Devices** using a pairing code. After pairing:

- Senders can tap **Send** next to a paired device while sharing: no manual ticket copy.
- Receivers get an in-app prompt when a paired sender invites them (app must be open).
- Manual tickets and the [sendme CLI](https://www.iroh.computer/sendme) still work exactly as before.


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
| The catch | WIP | Closed source; data handling cannot be audited | Same-network only, no resume | CLI-only; GUI front-ends are separate, community-maintained | WebRTC/SCTP throughput ceiling; browser memory limits |

[Know more →](https://www.dashbeam.net/en/compare)

## Under the hood

DashBeam is built on [Iroh](https://www.iroh.computer), a modern peer-to-peer networking stack that simplifies direct device-to-device communication. In practice, that means devices talk over encrypted QUIC, files move with content-addressed blobs, and relays help when a direct path isn’t available.

### The building blocks

| Piece | What it does here |
|-------|-------------------|
| **Blobs** (`iroh-blobs`) | Store and stream file data; every chunk is verified with BLAKE3 |
| **Tickets** | One string that tells a peer *who* to dial and *what* to fetch |
| **Endpoints** | Each device’s Iroh identity (Ed25519 key → endpoint id) |
| **QUIC + TLS 1.3** | Encrypted transport; multiplexing without head-of-line blocking |
| **Relays + hole punching** | Bootstrap connections across NATs; prefer direct, fall back to relay |
| **Control protocol** (pairing) | Long-lived channel to remember devices and deliver share invites |

### Blobs

Files aren’t uploaded to a server. They’re published as **blobs**: opaque byte sequences addressed by a BLAKE3 hash.

- A **link** is that 32-byte hash: if the hash matches, the content matches.
- Folders and large files use a **HashSeq** (a blob that points at other blobs).
- The sender is the **provider**; the receiver is the **requester**. Either side can do both.

### Tickets

A share **ticket** is a single token that packs:

1. The sender’s endpoint id (so you know you’re talking to the right device)
2. Enough address / relay info to dial them
3. The blob hash to download

You only connect to people you share a ticket with: no broadcasting your IP to strangers. That’s the default “cozy network” model Iroh encourages, vs. flooding discovery to the whole swarm.

### Connecting across networks

When two devices need to meet:

1. Each registers with a public (or self-hosted) **relay** so peers can find a path through firewalls and NATs.
2. Iroh tries **QUIC hole punching** to upgrade to a direct peer-to-peer link.
3. If a direct path works, traffic goes device-to-device. If not, the relay stays in the path as a fallback UDP hop.

Either way, the payload is end-to-end encrypted. Relays see ciphertext, not your files. [More on Iroh relays →](https://docs.iroh.computer/about/faq)

### QUIC & encryption

QUIC (UDP-based, same foundation as HTTP/3) brings TLS 1.3 into the transport. For DashBeam that buys encryption and authentication, multiple streams with shared congestion control, and fast reconnects when you’ve talked to a peer before.

### Paired devices

Pairing doesn’t replace tickets; it delivers them for you.

1. Devices exchange a short **pairing code** (the host’s endpoint id) over a dedicated control ALPN.
2. Each side proves identity by signing connection-bound keying material with its device secret, then remembers the peer locally.
3. A persistent control connection keeps presence (online/offline).
4. When you share, DashBeam still creates a normal one-time blob ticket; choosing a paired device ships that ticket as an in-app **invite** instead of making you copy-paste it.

Manual tickets and the [sendme CLI](https://www.iroh.computer/sendme) keep working exactly as before.

### Self-hosting relays

For how to run your own iroh relay, configure DashBeam to use it, and how mixed public/self-hosted setups behave, see [`deploy/relay/README.md`](deploy/relay/README.md#using-self-hosted-relays-with-dashbeam).


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
[badge-version]: https://img.shields.io/badge/version-0.6.0-blue
[badge-discord]: https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20CLI%2C%20-green
[badge-sponsor]: https://img.shields.io/badge/sponsor-ff69b4


