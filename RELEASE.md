# Building Release Builds

This guide covers how to build release versions of Alt-Sendme for macOS, Windows, and Linux.

## Prerequisites

Before building, ensure you have:
- **Rust 1.81+** installed (install from [rustup.rs](https://rustup.rs/))
- **Node.js 18+** and npm installed
- **System dependencies** (varies by platform, see below)

## Building for macOS

### Prerequisites

1. **Install system dependencies**:
   ```bash
   # Xcode Command Line Tools (required)
   xcode-select --install
   ```

2. **Install frontend dependencies**:
   ```bash
   cd web-app
   npm install
   ```

### Code Signing & Notarization

**Important**: Code signing affects how users can run your app:

- **Unsigned builds** (for personal use):
  - Will run but may show security warnings
  - Users need to right-click → Open (first time) to bypass Gatekeeper
  - Not suitable for distribution

- **Signed builds** (recommended for distribution):
  - No security warnings for users
  - Works seamlessly with Gatekeeper
  - Required for distribution to others

- **Notarized builds** (required for wide distribution):
  - Certified by Apple as safe
  - No warnings even on first launch
  - Required for distribution via website/download

### Building Unsigned (Quick Test)

For testing or personal use, you can build without signing:

```bash
cd src-tauri
cargo tauri build --release
```

The built application bundle will be in:
- `src-tauri/target/release/bundle/macos/ALT-SENDME.app`

**Note**: Users will see a warning the first time they run it.

### Building Signed & Notarized (For Distribution)

**Step 1: Get Apple Developer Certificate**

1. **Enroll in Apple Developer Program**:
   - Go to [developer.apple.com](https://developer.apple.com/programs/)
   - Enroll ($99/year for individuals)
   - Log into your Apple Developer account

2. **Create Developer ID Certificate**:
   - Open **Keychain Access** app
   - Go to: **Keychain Access** → **Certificate Assistant** → **Request a Certificate from a Certificate Authority**
   - Enter your email and name, select "Saved to disk"
   - Go to [Apple Developer Portal](https://developer.apple.com/account/resources/certificates/list)
   - Click **+** to create a new certificate
   - Select **Developer ID Application** certificate type
   - Upload the certificate request file
   - Download the certificate and double-click to install it in Keychain

**Step 2: Configure Environment Variables**

Set these environment variables before building:

```bash
# Your Apple Developer Team ID (find it in Apple Developer portal)
export APPLE_TEAM_ID="XXXXXXXXXX"

# Path to your signing certificate (usually "Developer ID Application: Your Name")
export APPLE_CERTIFICATE="Developer ID Application: Your Name (XXXXXXXXXX)"

# Apple ID for notarization
export APPLE_ID="your-email@example.com"

# App-specific password (create at appleid.apple.com)
export APPLE_PASSWORD="your-app-specific-password"
```

**Step 3: Update Tauri Configuration (Optional)**

You can configure signing in `src-tauri/tauri.conf.json` by adding a `bundle.macOS` section:

```json
{
  "bundle": {
    "active": true,
    "macOS": {
      "frameworks": [],
      "minimumSystemVersion": "10.13",
      "exceptionDomain": "",
      "signingIdentity": "Developer ID Application: Your Name (XXXXXXXXXX)"
    }
  }
}
```

**Step 4: Build with Signing**

```bash
cd src-tauri
cargo tauri build --release
```

Tauri will automatically sign the app if:
- `APPLE_SIGNING_IDENTITY` environment variable is set, OR
- The certificate name is configured in `tauri.conf.json`, OR
- The certificate matches your app's bundle identifier

**Step 5: Notarize the App**

After building, submit for notarization:

```bash
# Submit for notarization
xcrun notarytool submit \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  src-tauri/target/release/bundle/macos/ALT-SENDME.app \
  --wait

# Staple the notarization ticket
xcrun stapler staple src-tauri/target/release/bundle/macos/ALT-SENDME.app

# Verify notarization
xcrun stapler validate src-tauri/target/release/bundle/macos/ALT-SENDME.app
```

**Alternative: Using `altool` (deprecated but still works)**

```bash
# Submit for notarization
xcrun altool --notarize-app \
  --primary-bundle-id "com.sendme.desktop" \
  --username "$APPLE_ID" \
  --password "$APPLE_PASSWORD" \
  --file src-tauri/target/release/bundle/macos/ALT-SENDME.app

# Check status (use the UUID from previous command)
xcrun altool --notarization-info <UUID> \
  --username "$APPLE_ID" \
  --password "$APPLE_PASSWORD"

# Staple after approval
xcrun stapler staple src-tauri/target/release/bundle/macos/ALT-SENDME.app
```

### Verification

Check if your app is signed:

```bash
codesign -dv --verbose=4 src-tauri/target/release/bundle/macos/ALT-SENDME.app
```

Check if it's notarized:

```bash
spctl -a -vv src-tauri/target/release/bundle/macos/ALT-SENDME.app
```

### Troubleshooting Signing

- **"no identity found"**: Make sure your certificate is in Keychain and matches the identity name
- **"resource fork, Finder information, or similar detritus"**: Run `xattr -cr` on the .app before signing
- **Notarization fails**: Check Apple Developer email for detailed reasons
- **Gatekeeper still blocking**: Ensure notarization is stapled and verified

## Building for Windows

**Note**: Windows builds require a Windows machine or a Windows VM. Cross-compilation from Linux/macOS is not supported.

1. **Install system dependencies**:
   - Install Microsoft Visual C++ Build Tools or Visual Studio with C++ support
   - Install WebView2 (usually pre-installed on Windows 10/11)

2. **Install frontend dependencies**:
   ```bash
   cd web-app
   npm install
   ```

3. **Build the release bundle**:
   ```bash
   cd src-tauri
   cargo tauri build --release
   ```

   The built installer will be in:
   - `src-tauri/target/release/bundle/msi/ALT-SENDME_0.1.0_x64_en-US.msi`
   - Or NSIS installer in: `src-tauri/target/release/bundle/nsis/ALT-SENDME_0.1.0_x64-setup.exe`

## Building for Linux

### Debian/Ubuntu

1. **Install system dependencies**:
   ```bash
   sudo apt update
   sudo apt install libwebkit2gtk-4.1-dev \
     build-essential \
     curl \
     wget \
     file \
     libssl-dev \
     libgtk-3-dev \
     libayatana-appindicator3-dev \
     librsvg2-dev
   ```

2. **Install frontend dependencies**:
   ```bash
   cd web-app
   npm install
   ```

3. **Build the release bundle**:
   ```bash
   cd src-tauri
   cargo tauri build --release
   ```

   The built package will be in:
   - `.deb`: `src-tauri/target/release/bundle/deb/alt-sendme_0.1.0_amd64.deb`
   - `.AppImage`: `src-tauri/target/release/bundle/appimage/ALT-SENDME_0.1.0_amd64.AppImage`

### Fedora/RHEL

1. **Install system dependencies**:
   ```bash
   sudo dnf install webkit2gtk3-devel.x86_64 \
     openssl-devel \
     curl \
     wget \
     file \
     libappindicator-gtk3 \
     librsvg2-devel \
     gcc-c++
   ```

2. Follow steps 2-3 from Debian/Ubuntu instructions above.

### Arch Linux

1. **Install system dependencies**:
   ```bash
   sudo pacman -S webkit2gtk \
     base-devel \
     curl \
     wget \
     file \
     openssl \
     libappindicator-gtk3 \
     librsvg \
     libvips
   ```

2. Follow steps 2-3 from Debian/Ubuntu instructions above.

## Build Options

- **Build without installer/bundle** (just the binary):
  ```bash
  cargo tauri build --no-bundle
  ```
  The binary will be in: `src-tauri/target/release/alt-sendme` (or `.exe` on Windows)

- **Build for specific target**:
  ```bash
  # For example, build for Apple Silicon Macs
  cargo tauri build --release --target aarch64-apple-darwin
  
  # Or for Intel Macs
  cargo tauri build --release --target x86_64-apple-darwin
  ```

## Cross-Platform Building

Here are the best strategies for building across all platforms:

### Recommended Approach: Mac + GitHub Actions

**On your Mac** (for all macOS builds):
- Build for **Apple Silicon** (M1/M2/M3): `cargo tauri build --release --target aarch64-apple-darwin`
- Build for **Intel Macs**: `cargo tauri build --release --target x86_64-apple-darwin`
- You can also build both: `cargo tauri build --release --target aarch64-apple-darwin,x86_64-apple-darwin`
- **Advantage**: Full control over code signing and notarization on your machine

**GitHub Actions** (for Windows & Linux):
- Use GitHub Actions with Windows runners for Windows builds (.msi/.exe)
- Use GitHub Actions with Linux runners for Linux builds (.deb/.AppImage)
- Set up separate jobs for each platform
- Each platform runs on its native OS due to dependencies
- **Advantage**: Automated, reproducible builds without needing Windows/Linux machines

**Complete Workflow**:
1. Build macOS versions locally on your Mac (with signing/notarization)
2. Use GitHub Actions to build Windows and Linux versions automatically
3. All builds are versioned and ready for distribution

### Alternative: All-in-One GitHub Actions

You can also use GitHub Actions for **everything** including macOS:
- macOS builds (both architectures) on macOS runners
- Windows builds on Windows runners  
- Linux builds on Linux runners
- **Note**: Code signing for macOS requires setting up secrets (certificates, passwords) in GitHub

### Other Options

**Using Docker** (Linux only):
- Can use Docker to build Linux binaries from macOS/Windows
- For full bundles (.deb, .AppImage), still requires native Linux build

**Manual Cross-Compilation**:
- macOS: ✅ Can build for different architectures (Intel/Apple Silicon) on the same machine
- Windows/Linux: ❌ Not easily cross-compilable, recommend using CI/CD or native builds

