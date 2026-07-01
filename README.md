<div align="center">

# File transfer doesn't need to be complicated

</div>


![AltSendme Header](assets/header.png)

<div align="center">

![AltSendme working demo](assets/demo.gif)

</div>

<div align="center">


[![Discord][badge-discord]](https://discord.gg/xwb7z22Eve)
![Version][badge-version]
![Website][badge-website]
![Platforms][badge-platforms]
[![Sponsor][badge-sponsor]](https://github.com/sponsors/tonyantony300)


</div>



A free and open-source file transfer tool that harnesses the power of [cutting-edge peer-to-peer networking](https://www.iroh.computer), letting you transfer files directly without storing them on cloud servers.

Why rely on WeTransfer, Dropbox, or Google Drive when you can reliably and easily transfer files directly, end-to-end encrypted and without revealing any personal information?

Join our [Discord](https://discord.gg/xwb7z22Eve) to contribute

## Features

- **Send anywhere** – Works seamlessly on local networks or across continents.
- [**Transfer anything**](https://www.iroh.computer/proto/iroh-blobs) – Send files or directories of any size or any format, verified with BLAKE3-based integrity checks.
- **No accounts or personal info** – Transfer files without sign-ups or exposing personal info.
- **Peer-to-peer direct transfer** – Send files straight between devices, with no cloud storage in between.
- **Authentication** - Tickets contains cryptographic identity info for authentication.
- **End-to-end encryption** – Always-on protection with QUIC + TLS 1.3 for forward and backward secrecy.
- **Resumable transfers** – Interrupted downloads automatically resume where they left off.
- **Broadcast** - Share same file/folder with any number of peers.
- **Preview** - View and verify before downloading
- **Fast & reliable** – Capable of saturating multi-gigabit connections for lightning-fast transfers.
- [**NAT traversal via QUIC**](https://www.iroh.computer/docs/faq#does-iroh-use-relay-servers) – Secure, low-latency connections using QUIC hole punching with encrypted relay fallback.
- **CLI integration** – Interoperable with the [Sendme CLI](https://www.iroh.computer/sendme).
- **Free & open source** – No upload costs, no size limits, and fully community-driven.
- **Coming Soon** – Mobile and Web versions



## Installation

The easiest way to get started is by downloading one of the following versions for your respective operating system:

<table>
  <tr>
    <td><b>Platform</b></td>
    <td><b>Download</b></td>
  </tr>
  <tr>
    <td><b>Windows</b></td>
    <td><a href='https://github.com/tonyantony300/alt-sendme/releases/download/v0.4.1/AltSendme_0.4.1_x64-setup.exe'>AltSendme.exe</a> (x64)</td>
  </tr>
  <tr>
    <td><b>macOS</b></td>
    <td><a href='https://github.com/tonyantony300/alt-sendme/releases/download/v0.4.1/AltSendme_0.4.1_universal.dmg'>AltSendme.dmg</a></td>
  <tr>
    <td><b>Linux </b></td>
    <td><a href='https://github.com/tonyantony300/alt-sendme/releases/download/v0.4.1/AltSendme_0.4.1_amd64.deb'>AltSendme.deb</a></td>
  </tr>
  <tr>
    <td><b>Android</b></td>
    <td><a href='https://github.com/tonyantony300/alt-sendme/releases/download/v0.4.1/AltSendme-v0.4.1-universal.apk'>AltSendme.apk</a></td>
  </tr>

</table>

**Windows on ARM** (Snapdragon / Copilot+ PC): use `AltSendme_*_aarch64-setup.exe` from [GitHub Releases](https://github.com/tonyantony300/alt-sendme/releases).

**Windows (Scoop)**


```bash
scoop bucket add extras
scoop install extras/altsendme
```

More download options in [GitHub Releases](https://github.com/tonyantony300/alt-sendme/releases).

## Partners

<a href="https://www.testmuai.com" rel="nofollow">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.altsendme.com/assets/sponsors/testmu-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://www.altsendme.com/assets/sponsors/testmu-dark.svg">
    <img src="https://www.altsendme.com/assets/sponsors/testmu-dark.svg" height="80" alt="TestMuAI">
  </picture>
</a>

We're looking for Partners to join our mission! Partner with us and support while we push the boundaries of peer-to-peer file transfer.

[**LET'S CHAT**](https://www.altsendme.com/en/contact)

## Supported Languages
 🇺🇸 🇷🇺 🇫🇷 🇨🇳 🇩🇪 🇯🇵 🇮🇳 🇹🇭 🇮🇹 🇨🇿 🇪🇸 🇧🇷 🇸🇦 🇮🇷 🇰🇷  🇵🇱 🇺🇦 🇹🇷 🇳🇴 🇧🇩 🇭🇺 🇷🇸 🇹🇼 🇰🇭

 
## How it works 

1. Drop your file or folder - AltSendme creates a one-time share code (called a "ticket").
2.  Share the ticket via chat, email, or text.
3. Your friend pastes the ticket in their app, and the transfer begins.


## Under the hood ⚙️🛠️

AltSendme uses [Iroh](https://www.iroh.computer) under the hood to enable peer-to-peer file transfer. It is a modern modular alternative to technologies like WebRTC and libp2p.

### Important concepts 

- *Blobs*
- *Tickets*
- *Peer Discovery*, *Hole-punching* & *NAT traversal*
- *QUIC* & *End-to-end encryption*
- *Relays*


### 1. Blobs

Content-addressed blob storage and transfer. `iroh-blobs` implements request/response and streaming transfers of arbitrary-sized byte blobs, using BLAKE3-verified streams and content-addressed links.

- Blob: an opaque sequence of bytes (no embedded metadata).
- Link: a 32-byte BLAKE3 hash that identifies a blob.
- HashSeq: a blob that contains a sequence of links (useful for chunking/trees).
- Provider / Requester: provider serves data; requester fetches it. An endpoint can be both.

### 2. Tickets

Tickets are a way to share dialing information between iroh endpoints. They're a single token that contains everything needed to connect to another endpoint, or to fetch a blob in this case. Contains Ed25519 NodeIds: Your device's cryptographic identity for authentication.They're also very powerful. It's worth pointing out this setup is considerably better than full peer-2-peer systems, which broadcast your IP to peers. Instead in iroh, tickets are used to form a "cozy network" between peers you explicitly want to connect with. It's possible to go "full p2p" & configure your app to broadcast dialing details, but tickets represent a better middle-ground default.


### 3. Peer Discovery, NAT Traversal & Hole Punching

Peers register with an open-source public relay servers at startup to help traverse firewalls and NATs, enabling connection setup. Once connected, Iroh uses QUIC hole punching to try and establish a direct peer-to-peer connection, bypassing the relay. If direct connection is possible, communication happens directly between peers with end-to-end encryption; otherwise, the relay operates only temporarily as a fallback. This enables smooth reliable connections between peers within local-network and across the internet.

###  4. QUIC & Encryption

QUIC is a modern transport protocol built on UDP, designed to reduce latency and improve web performance over TCP. Developed originally by Google and now standardized by the IETF as HTTP/3's foundation, it integrates TLS 1.3 encryption directly into the protocol.

QUIC allows following super-powers:
* encryption & authentication
* stream multiplexing
    * no head-of-line blocking issues
    * stream priorities
    * one shared congestion controller
* an encrypted, unreliable datagram transport
* zero round trip time connection establishment if you've connected to another endpoint before


### 5. Relays

AltSendme uses open-source public relay servers to support establishing direct connections, to speed up initial connection times, and to provide a fallback should direct connections between two endpoints fail or be impossible otherwise. All connections are end-to-end encrypted. The relay is “just another UDP socket” for sending encrypted packets around. [Read more.](https://docs.iroh.computer/about/faq)

### Self-hosting relays

You can run your own iroh relay and point AltSendme at it instead of the public infrastructure:

1. Deploy a relay using the assets in [`deploy/relay/`](deploy/relay/README.md) (Docker Compose on a VPS or Fly.io).
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

**Quick rules of thumb:**

- **Just want it to work?** An open self-hosted relay (no auth token) is enough; the other person can keep default public relays.
- **Want a private relay?** Both people need your relay URL **and** the auth token in **Settings → Network**.
- **Want zero public relay use?** Both people must set **Custom self-hosted** to the same relay(s).
- **Want no relays at all?** Both people set **Disabled** — only works when a direct connection is possible (e.g. same network).


## Roadmap 🚧

- Cross-platform Mobile versions
- Phrase-based Addressing via Iroh-gossip and PAKE
- Web version (Send and receive from browser)
- Better system/network insights into transfer process


[📫 Drop your Email to recieve updates](https://tally.so/r/ob2Vkx)


## Development Setup

### Prerequisites

- Rust 1.91+
- Node.js 18+
- npm or yarn

### Getting Started

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/your-username/alt-sendme.git
   cd alt-sendme
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install Tauri**:
   ```bash
   cargo install tauri-cli
   ```

4. **Run in development mode**:
   ```bash
   cargo tauri dev
   ```

5. **(Optional) Setup android project**:
   ```bash
   rm src-tauri/gen/android
   cargo tauri android init
   git checkout src-tauri/gen/android
   cargo tauri android dev
   ```
   
6. **Build locally** :
   ```bash
    cargo tauri build --no-bundle
   ```

7. **Install on Android** :
   ```
   npm run android:build -- --debug --apk
      
   adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk
   ```

### Pre-requirements for NixOS

1. **Install [devenv](https://devenv.sh/getting-started/)**

2. **Run**:
  ```bash
  devenv shell
  ```

Then proceed with the instructions above.



## Testing Locally

Install [Sendme CLI](https://www.iroh.computer/sendme) tool and you can share files within same device to test the whole transfer process. Files don't leave your device it works like a copy operation.

## Join our [Discord](https://discord.gg/xwb7z22Eve) to contribute

The best way to contribute is to join our Discord and say hi. Introduce yourself and share what skills or interests you have - whether that’s coding, testing, design, or something else. You can also raise issues, suggest fixes, or pitch ideas. Maintainers are there to guide you every step of the way.

It’s the best place to get context, align on direction, and collaborate with the [community](https://discord.gg/xwb7z22Eve).

## License

AGPL-3.0

## Privacy Policy

See [PRIVACY.md](PRIVACY.md) for information about how AltSendme handles your data and privacy.

[![Sponsor](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/tonyantony300) [![Buy Me Coffee](https://img.shields.io/badge/Buy%20Me%20Coffee-FF5A5F?style=for-the-badge&logo=coffee&logoColor=FFFFFF)](https://buymeacoffee.com/tny_antny)


## Contributors

<a href="https://github.com/tonyantony300/alt-sendme/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tonyantony300/alt-sendme" />
</a>


## Contact

Reach me [here](https://www.altsendme.com/en/contact) for suggestions, feedback or media related communication.


Thank you for checking out this project! If you find it useful, consider giving it a star and helping spread the word.




## Built on

<div align="left">
  <a href="https://iroh.computer">
    <img alt="iroh" src="https://raw.githubusercontent.com/n0-computer/iroh/main/.img/iroh_wordmark.svg" width="200">
  </a>
</div>




<!-- <div align="center" style="color: gray;"></div> -->

[badge-website]: https://img.shields.io/badge/website-altsendme.com-orange
[badge-version]: https://img.shields.io/badge/version-0.4.1-blue
[badge-discord]: https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white
[badge-platforms]: https://img.shields.io/badge/platforms-macOS%2C%20Windows%2C%20Linux%2C%20Android%2C%20-green
[badge-sponsor]: https://img.shields.io/badge/sponsor-ff69b4


