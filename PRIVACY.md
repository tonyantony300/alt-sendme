# Privacy Policy

**Last Updated:** Aug 1 - 2026

DashBeam is designed with privacy and security as core principles. This privacy policy explains how the application handles your data and what information may be visible to third parties.

## Core Privacy Principles

- **No Account Required**: DashBeam does not require user registration, accounts, or any personal information
- **End-to-End Encryption**: All file transfers are encrypted end-to-end using QUIC + TLS 1.3
- **Peer-to-Peer**: Files are transferred directly between sender and receiver when possible
- **No Usage Tracking**: DashBeam does not collect telemetry or transfer statistics.

## How DashBeam Works

DashBeam uses peer-to-peer (P2P) networking technology powered by [Iroh](https://www.iroh.computer) to transfer files directly between devices. The application:

1. **Establishes Direct Connections**: When possible, files are transferred directly between devices using NAT hole punching
2. **Uses Relay Servers as Fallback**: If direct connection isn't possible, the application may use relay servers to facilitate the transfer
3. **Encrypts All Traffic**: All file data is encrypted end-to-end, meaning only the sender and receiver can decrypt it

## Data Stored Locally

DashBeam stores the following data locally on your device:

- **Secret Keys**: On desktop, your device's Iroh secret key is stored in the OS credential store (macOS Keychain, Windows Credential Manager, Linux Secret Service) under the `alt-sendme` service name. Public device metadata (display name, endpoint ID) is stored in the app data directory. During active transfers, temporary files are stored in your system's temp directory.
- **Paired devices**: When you pair devices, DashBeam stores the remote device's endpoint ID and display name locally. Paired invites deliver the same one-time blob ticket as manual sharing; tickets are not reused across shares.
- **Discoverability preference**: Whether this device advertises itself on the local network (Everyone / Paired only / Off), stored locally.
- **App settings**: Preferences such as start-at-login, keep-running-in-background, and system notifications toggles remain on your device.
- **Downloaded Files**: Files you receive are saved to a location you choose
- **Debug Logs**: Only when you explicitly enable **Debug logging** (see below). Off by default.

This data never leaves your device unless you explicitly share it (e.g., by sharing a transfer ticket).

## Debug Logging (Diagnostics)

DashBeam includes an **opt-in** debug mode to help diagnose bug reports. It is **off by default**, must be turned on manually in **Settings → General**, and only takes effect after you restart the app.

**This is not telemetry.** Nothing is transmitted, uploaded, or sent to us automatically. Logs are written to a file on your device and stay there.

**What is recorded while it is on:**
- Connection diagnostics: local and remote IP addresses and ports, NAT traversal attempts, whether a connection is direct or relayed
- Relay and discovery server URLs you are configured to use
- Your device's endpoint ID (public key), device name, type, and OS
- Application version, and transfer start/failure events
- Pairing activity: when a pairing code is opened, join attempts, invites sent and accepted or declined, and devices you unpair
- **Names of files and folders you share**, and paths referenced by error messages

**Your control:**
- It is off unless you turn it on, and turning it off stops collection after the next restart
- Logs are size-capped and old sessions are pruned automatically
- Turning debug logging off deletes the captured logs straight away; **Clear logs** does the same at any time
- **Save diagnostics…** writes a single file for you to review. Sharing it with us is entirely your decision. We recommend opening and reading it first, as it contains the network and device details listed above

## Network Connections and Third-Party Services

### Relay Servers

By default, DashBeam may use relay servers operated by the [Iroh project](https://www.iroh.computer) (n0) when direct peer-to-peer connections cannot be established. 

**What Relay Servers May See:**
- Connection metadata (IP addresses, connection timestamps)
- Connection duration
- Amount of data transferred (bandwidth usage)

**What Relay Servers Cannot See:**
- File contents (all data is encrypted end-to-end)
- File names or directory structures
- File metadata beyond transfer size
- Who you are communicating with (only encrypted connection endpoints)

**Your Control:**
- You can disable relay servers entirely in **Settings → Infra** (this may limit connectivity in some network configurations)
- You can configure custom self-hosted relay servers in **Settings → Infra** (see [`infra/relay/`](infra/relay/README.md) in the project repo)
- You can configure a custom self-hosted discovery server in **Settings → Infra** (see [`infra/dns/`](infra/dns/README.md) in the project repo)
- Relay servers are only used when direct connections fail

### Discovery (Pkarr)

When using Node ID-only tickets, DashBeam uses public-key based discovery (Pkarr) to find peer addresses. This service may temporarily store:
- Node addresses (relay URL and/or IP addresses) associated with Node IDs
- This information is signed by the device's own key and used only for connection establishment

**Your Control:**
- By default, DashBeam uses the discovery servers operated by the [Iroh project](https://www.iroh.computer) (n0).
- You can configure a custom self-hosted discovery server in **Settings → Infra** (see [`infra/dns/`](infra/dns/README.md) in the project repo). Discovery is independent of relays - you can self-host either, both, or neither.
- Custom discovery publishes over HTTPS pkarr. If you also set a **DNS origin** (advanced real-DNS path), resolution may use your system DNS resolver for TXT lookups under that origin, in addition to HTTPS — the same class of disclosure as default n0 DNS discovery.
- Discovery records are self-authenticating: a discovery server never sees file contents or names, only small signed address records.

### Direct Connections

When a direct peer-to-peer connection is established (the preferred method), no third-party servers are involved in the transfer.

### Local Network Discovery (mDNS)

On desktop and Android, DashBeam can optionally discover other DashBeam devices on the same Wi-Fi or LAN using [multicast DNS (mDNS)](https://en.wikipedia.org/wiki/Multicast_DNS). This is separate from internet relays and Pkarr discovery.

**What may be visible on your local network** (depending on **Settings → Network → Your discoverability**):

- **Everyone**: Nearby peers can learn that a DashBeam device is present and see its display name and device type.
- **Paired only**: Nearby peers can detect that a device exists, but not its display name.
- **Off**: This device does not advertise itself. You can still browse and contact others who remain discoverable.

mDNS traffic stays on your local subnet. It is not sent to DashBeam, Iroh relays, or other internet services. Guest Wi-Fi, corporate networks, and many VPNs often block multicast; when that happens, Nearby is unavailable and you can still use tickets or internet pairing.

### System Notifications

When **Settings → General → Show system notifications** is enabled, DashBeam may ask the OS to show local notifications for pair requests, file invites, and related outcomes. Notification text can include a device display name and file count or size. Notifications are delivered by your operating system and are not uploaded to DashBeam servers.

## Encryption and Security

- **Encryption Protocol**: All traffic uses QUIC protocol with TLS 1.3 encryption
- **Content Verification**: Files are verified using Blake3 cryptographic hashing to ensure integrity
- **Node IDs**: 256-bit cryptographic node identifiers are used for peer authentication
- **No Plaintext**: File contents are never transmitted or stored in unencrypted form

## What This Project Doesn't Do

- ❌ No personal information is collected
- ❌ File contents are not tracked
- ❌ Files are not stored or accessed in any servers - no server end
- ❌ Tracking services or cookies are not used
- ❌ Data is not shared with third parties


## Open Source and Transparency

DashBeam is open source software licensed under AGPL-3.0. You can:
- Review the complete source code on [GitHub](https://github.com/tonyantony300/dashbeam)
- Verify how the application handles your data
- Build and run the application yourself if desired
- Contribute improvements to privacy and security features

## Your Rights and Control

You maintain full control over:
- Which files you send and receive
- Where files are saved on your device
- Whether to use relay servers (can be disabled)
- Whether to use custom relay servers
- Whether to use a custom self-hosted discovery server
- Whether this device is discoverable on the local network, and how much identity it advertises
- Whether system notifications are shown
- Whether to enable debug logging, and whether to share a diagnostics file
- Local data storage (can be cleared by uninstalling the application)

## Data Retention

- **Secret Keys**: Stored locally until you delete the application or clear application data
- **Temporary Transfer Files**: Automatically cleaned up when transfers complete or the application closes
- **Downloaded Files**: Remain on your device until you delete them
- **Debug Logs**: Only created while debug logging is on; size-capped, pruned automatically, and deleted at the next launch after you turn it off

## Third-Party Services

DashBeam uses the following third-party services:

1. **Iroh Network Library**: Core P2P networking functionality ([Iroh Privacy](https://www.iroh.computer))
2. **Default Relay Servers**: Operated by the Iroh project, used only when direct connections fail
3. **DNS Discovery**: Used for peer discovery when necessary (default n0 path, or your configured DNS origin when the advanced real-DNS option is enabled)

You may review the privacy policies of these services if you have concerns.

## Changes to This Policy

This privacy policy may be updated from time to time. The "Last Updated" date at the top indicates when changes were made. Continued use of DashBeam after changes constitutes acceptance of the updated policy.

## Contact

If you have questions about this privacy policy or how DashBeam handles your data, please open an issue on [GitHub](https://github.com/tonyantony300/dashbeam/issues).

## Disclaimer


While DashBeam is designed with privacy and security in mind, no method of transmission over the internet is 100% secure. Users should:
- Only share transfer tickets with trusted parties
- Be aware that encrypted transfer metadata may still be visible to relay server operators (connection metadata only)
- Consider using custom relay servers or disabling relays for maximum privacy
- Understand that direct peer-to-peer connections may expose your IP address to the other party and also to any relay server facilitating the connection.
- On a shared local network, set discoverability to **Paired only** or **Off** if you do not want other people on that LAN to see your device name in Nearby.
