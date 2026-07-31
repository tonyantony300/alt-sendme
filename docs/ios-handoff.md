# iOS target — handoff

Groundwork for an iOS build lives on `feat/ios-target`. It was written **without Xcode, without an iOS device, and without App Store Connect access**, so everything iOS-specific in it is unverified by construction. This document exists so someone who has those things can pick the work up cold.

Everything here is either verified-and-stated-as-such, or explicitly flagged as unverified. Nothing is assumed to work.

---

## 1. Do this first

Two checks, in this order. Both are cheap, and the second has burned people before.

### 1a. Does the Rust tree actually cross-compile?

```bash
git checkout feat/ios-target
rustup target add aarch64-apple-ios
cargo build --manifest-path src-tauri/Cargo.toml --target aarch64-apple-ios --lib
```

This has **never been run to completion**. CI got past toolchain setup and was mid-compile when the run was stopped, so the target installs correctly but the build result is unknown.

The likeliest blocker was already removed — `engine` carried `crossterm`, a termios/TTY crate, which almost certainly would not build for iOS (see §3). The remaining suspect is `aws-lc-sys`: it appears in `src-tauri/Cargo.lock` as an optional dependency of `rustls`, `quinn-proto` and `rustls-webpki`. The project configures rustls with `default-features = false` toward `ring`, so it is probably not compiled — but lockfile presence does not prove feature deactivation, and `aws-lc-sys` cross-compiling to iOS needs `cmake` and is a classic failure. If the build dies there:

```bash
cargo tree -e features --target aarch64-apple-ios --manifest-path src-tauri/Cargo.toml | grep aws-lc
```

### 1b. Does `IS_IOS` resolve to true?

**This is the highest-value five minutes on the whole project.**

`frontend/src/lib/platform.ts:27` derives `IS_IOS` from `import.meta.env.TAURI_PLATFORM`, which `vite.config.ts` defines from `process.env.TAURI_ENV_PLATFORM`. Every frontend iOS branch depends on that string arriving non-empty. `IS_IOS` currently has **zero consumers**, so nobody has ever confirmed it does.

If it arrives empty, every iOS-specific behaviour is silently inert and will present as a dozen unrelated bugs. Check it in the simulator via Safari → Develop → Simulator → DashBeam:

```js
console.log({ IS_TAURI, IS_IOS, IS_MOBILE, platform: import.meta.env.TAURI_PLATFORM })
```

If it is empty, add a UA fallback in `platform.ts` rather than chasing symptoms. Note iPadOS can report as `MacIntel`, so a UA check needs the touch-points test too — `ShareLinkPanel.tsx:202` already uses that pattern.

---

## 2. Prerequisites

- **Full Xcode** (not just Command Line Tools), then `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` and `sudo xcodebuild -license accept`
- `brew install cocoapods xcodegen`
- Paid Apple Developer account
- Physical iPhone **and** iPad — the simulator cannot exercise real local-network discovery, hole punching, or the share sheet
- Register App IDs `com.dashbeam.ios` and `com.dashbeam.ios.ShareExtension`, plus App Group `group.com.dashbeam.ios`. **Do this early** — provisioning propagation is the slowest serial dependency in the project.

---

## 3. What is already on the branch

All of it verified green on desktop and Android (`cargo check` on `src-tauri`, full engine E2E suite, `pnpm lint`, `pnpm test:lib`). None of it verified on iOS.

| Change | Why |
|---|---|
| `engine` CLI deps deleted | `clap`, `console`, `crossterm`, `indicatif`, `tracing-subscriber`, `irpc` plus the `clipboard` feature. All were unused — no references in `engine/*/src`, no `[[bin]]` target — but still compiled into every build. Dropped **460 lines of transitive deps**. `crossterm` was the largest speculative iOS blocker. |
| 34 `cfg` gates widened | The node service, its 13 pairing commands, and the `RunEvent::Exit` shutdown were gated `any(desktop, target_os = "android")`. Tauri's `desktop` cfg is `not(mobile)`, so **pairing was excluded from iOS by construction.** Now `any(desktop, mobile)`. |
| `IS_PAIRING_CAPABLE` | `IS_DESKTOP \|\| IS_ANDROID` → `IS_DESKTOP \|\| IS_MOBILE`. Reaches ~14 pairing files with no further edits. |
| Self-updater hidden on iOS | Was `IS_TAURI && !IS_ANDROID`, so it would have rendered on iOS. App Store apps cannot self-update. |
| `capabilities/ios.json` | Was a stub granting only `core` + `deep-link`. Now at `android.json` parity, plus `notification`, minus window dragging. |
| `tauri.ios.conf.json` | New. Identifier `com.dashbeam.ios`, updater nulled, minimum system version 17.0. |
| `ios-build` CI job | `cargo build --target aarch64-apple-ios --lib` on `macos-latest`. Needs no signing, certificate or device. |

### Deliberately not done

- **No `targets` key in `rust-toolchain.toml`.** That file is load-bearing for F-Droid reproducible builds; Apple targets would be a wasted download on every Linux build. The CI job installs them instead.
- **Save-path, share-sheet and folder-picker sites still say `IS_ANDROID`.** They are coupled to the iOS save model and Swift plugin that do not exist yet. Widening their copy now would half-wire them against a missing backend. Specifically: `receive-save-path.ts:6`, `PairedInviteDialog.tsx:90`, `ReceiveSaveLocationPicker.tsx:27,33`, `useDragDrop.ts:238,264,447`.

---

## 4. Decisions already taken

These were settled with the maintainer. Changing them is fine, but know you are reopening a decision.

| Area | Decision |
|---|---|
| Distribution | App Store / TestFlight |
| Target | iOS 17+, iPhone **and** iPad |
| Received files | App's own `Documents/` via `UIFileSharingEnabled` + `LSSupportsOpeningDocumentsInPlace`, with `isExcludedFromBackupKey`. **No** security-scoped bookmarks. |
| Backgrounding | `beginBackgroundTask` grace + idle-timer disable + honest "keep app open" UI + endpoint rebuild on foreground. **No** audio/location background-mode abuse — it is a well-known rejection reason. |
| Local network | Disable iroh port mapping on iOS. `NSLocalNetworkUsageDescription` only, **no** multicast entitlement request (open-ended Apple approval, often denied). |

**Why Documents-direct matters beyond simplicity:** Android downloads into a private staging dir, then `export_to_tree` copies everything into the SAF tree — 2× disk and 2× write time. Writing straight to `Documents/` means the export step disappears entirely, so for the large files this app targets, **iOS ends up structurally faster than Android**. There is no `finalize_ios_receive` to write; leave `finalize_android_receive` (`commands.rs:440-483`) Android-only.

---

## 5. What is left, in dependency order

### 5.1 The Swift plugin — the big one

`src-tauri/plugins/tauri-plugin-native-utils/` has **no `ios/` directory**. The Rust side is already iOS-ready: `build.rs` declares `.ios_path("ios")` and `src/mobile.rs:10,21` has `tauri::ios_plugin_binding!` / `register_ios_plugin`. **The build will fail until the Swift package exists.**

Port from the four Kotlin files in `android/src/main/java/com/dashbeam/plugin/native_utils/` (~820 lines). The shapes differ:

| Command | Android | iOS |
|---|---|---|
| `get_window_insets` | `InsetUtils.kt` | `view.safeAreaInsets`. Possibly returnable as zeros — CSS `env()` works natively in WKWebView with `viewport-fit=cover`, which `index.html` already sets. |
| `select_send_document` | `ACTION_OPEN_DOCUMENT` + cache copy | `UIDocumentPickerViewController(forOpeningContentTypes:asCopy: true)`. `asCopy` avoids bookmarks entirely. |
| `select_send_folder` | `ACTION_OPEN_DOCUMENT_TREE` | Folders cannot use `asCopy`. Needs a **transient** `startAccessingSecurityScopedResource()` / `defer { stopAccessing… }` around enumeration. This is an in-call grant, not the persistent-bookmark model that was ruled out. |
| `select_download_folder` | SAF tree + persisted permission | **No picker.** Return the app's `Documents/` URL; set `isExcludedFromBackupKey` once at first use. |
| `open_download_folder` | `ACTION_VIEW` on tree URI | Prefer `UIActivityViewController` over the received file URLs. On iPad you **must** set `popoverPresentationController.sourceView`/`sourceRect` or it crashes. |
| `export_to_tree` | staging → SAF copy | **Not needed.** No-op returning success, so the Rust caller stays uniform. |
| `consume_share_intent` | drains Activity intent | reads file URLs the share extension wrote into the App Group container |
| `cancel_job` | cancels coroutine by `channelId` | cancels the matching `Task` by `channelId` |

**Four gotchas that each cost a day if found late:**

1. `@_cdecl("init_plugin_native_utils")` must match `src/mobile.rs:10` exactly.
2. **Method names stay snake_case.** Tauri builds the Obj-C selector as `"\(invoke.command):"`, so it is `@objc public func select_download_folder(_ invoke: Invoke)`. Do not camelCase.
3. **The iOS `Plugin` base class has no `onNewIntent`/`onResume`** — only `load(webview:)`, `trigger`, `checkPermissions`, `requestPermissions`. Android's re-advertise pattern must be rebuilt with a `NotificationCenter` observer on `UIApplication.didBecomeActiveNotification`, registered in `load(webview:)`. This is also the hook for the foreground endpoint rebuild.
4. **`PluginManager.invoke` dispatches on a serial queue.** Any blocking command stalls *all* plugin IPC. Hand off to a `Task`/`DispatchQueue` immediately and return.

Keep the JS contract byte-identical — `frontend/src/plugins/nativeUtils.ts` and `bindCopyChannel` must not change. Note `copiedBytes`/`totalBytes` are **strings** and `cachedPaths` is a **JSON-encoded string**, not an array. The `permissions/autogenerated/commands/*.toml` ACL files are platform-agnostic and get reused unchanged.

### 5.2 Receive path

Add an iOS arm to `resolve_receive_output_dir` (`commands.rs:494-523`) returning `app_handle.path().document_dir()`, writing directly with no staging.

**Verified good news:** `dirs 6.0.0` gates its Mac module `#[cfg(any(target_os = "macos", target_os = "ios"))]`, and Tauri's path resolver wraps `dirs` for everything that is not Android — so `app_data_dir()` and `document_dir()` **work correctly on iOS with zero changes**.

**Verified bad news:** the same fact means `dirs::download_dir()` returns `Some($HOME/Downloads)` on iOS rather than `None`, so `engine/native/src/receive.rs:83` will silently write to a bogus `<container>/Downloads` rather than failing loudly. Fix the fallback.

**One real regression risk of dropping staging:** Android got filename dedup for free because its staging dir was always fresh. `Documents/` is persistent and accumulating, so confirm `export_to_directory` (`receive.rs:88`) suffix-dedups rather than overwrites. Test receiving the same filename twice.

### 5.3 Blob store off `NSTemporaryDirectory`

`engine/native/src/storage.rs` puts send and recv blob stores in `std::env::temp_dir()`. On iOS that is `NSTemporaryDirectory()`, which the OS may purge under storage pressure — that breaks resume-after-cancel, since `commands.rs` tracks `last_cancelled_recv_hash` and expects `.sendme-recv-<hash>` to survive. Move the recv store to Application Support with `isExcludedFromBackupKey`.

Related: `cleanup_orphaned_directories()` (`lib.rs:23-40`) scans `std::env::current_dir()`, which is the read-only bundle on iOS. Harmless but dead weight — gate it to `desktop` or point it at the blob root.

### 5.4 Device identity

`engine/protocol/src/identity.rs`:
- `default_device_type()` returns `"phone"` for iOS unconditionally, so **iPads will report as phones** and iPad is in scope. Read `sysctlbyname("hw.machine")` and return `"tablet"` for an `iPad` prefix. This is a syscall, not `fork`/`exec`, so it is App Store safe. (The Android tablet half of this bug is already fixed on `main` — mirror that shape.)
- `default_display_name()` has no iOS branch, so every iPhone shows as the generic `"DashBeam Device"`. Map `hw.machine` to a marketing name. **Do not use `UIDevice.current.name`** — since iOS 16 it returns a generic model string without a special entitlement.
- Add `"iphone"`/`"ipad"` to `is_placeholder_display_name()`.

### 5.5 Port mapping

Apply `EndpointBuilder::portmapper_config(PortmapperConfig::Disabled)` on iOS at the six non-wasm builder sites: `native/src/send.rs:45`, `native/src/receive.rs:45`, `native/src/node.rs:1247,1256`, `protocol/src/receive.rs:264`, `protocol/src/discovery.rs:184`, `protocol/src/relay.rs:180,346`.

**Calibration:** this is not critical-path. Left enabled, the SSDP multicast sends fail with `EPERM` and are logged, not fatal, and NAT-PMP/PCP are plain unicast and do work. The reason to do it is to quiet logs and avoid an App Review question about multicast.

### 5.6 Backgrounding and lifecycle

`NodeService::reconfigure_network` (`node.rs:641-687`) already does a full router shutdown + endpoint close + rebuild, but it **early-returns when relay/discovery are unchanged**, so it cannot serve as a resume hook as-is. Extract the body into a `rebuild_endpoint()` that skips that guard.

This matters because `paired_connections.rs` runs a 30s supervisor loop and holds long-lived control connections that all die on suspension. Expect and design for: **paired devices will show an iPhone as offline whenever it is backgrounded**, with no push mechanism to wake it. Say so honestly in the devices UI.

### 5.7 Share extension

Second Xcode target sharing App Group `group.com.dashbeam.ios`.

**The constraint that will bite you: extensions have a hard ~120 MB memory ceiling.** The extension must move file **URLs** into the App Group container and never load bytes. Use `NSItemProvider.loadFileRepresentation` with a streaming `FileHandle` copy — never `Data(contentsOf:)`. Test with a 2 GB video early; this is the classic iOS share-extension failure.

### 5.8 Universal Links

`tauri.conf.json` already configures the client half (`plugins.deep-link.mobile`, `https://app.dashbeam.net/receive`, `appLink: true`). Missing is server-side: an `apple-app-site-association` file at `https://app.dashbeam.net/.well-known/`, `Content-Type: application/json`, no redirect, listing `"appID": "<TEAMID>.com.dashbeam.ios"`.

**Start this early — AASA propagation through Apple's CDN takes up to 24h**, and it is the classic "works in dev, broken in TestFlight" trap. Test on a TestFlight build; dev builds can bypass AASA and mask a broken file. Check `vercel.json` / `infra/` for who serves that host.

---

## 6. Git policy for `gen/apple` — decide before writing the share extension

Do **not** copy the Android pattern. `scripts/android-release-build.js` deletes `gen/android`, re-runs `tauri android init --ci`, then `git checkout HEAD -- .../src/main/` to restore 25 force-added files. That works because Android's hand-edited state is one manifest plus icons.

iOS state is project-level — the share extension target, App Group, entitlements and Info.plist keys all live in the Xcode project — so regeneration destroys it. Tauri sanctions committing `gen/apple`:

- `.gitignore`: keep `src-tauri/gen/*`, add `!src-tauri/gen/apple`
- Run `tauri ios init` **exactly once**, commit, and document "never re-run init" in `CONTRIBUTING.md`
- Add the extension target by editing `gen/apple/project.yml` (an XcodeGen spec) and regenerating with `xcodegen generate`, so the `.pbxproj` stays reproducible

---

## 7. On-device checklist

Each against a real Android device as counterpart:

1. Send iOS → receive Android
2. Send Android → receive iOS; files land in Files under On My iPhone → DashBeam
3. Multi-GB transfer — confirm no double copy, and that iCloud backup size does not grow
4. Receive the same filename twice → dedup, not overwrite (see §5.2)
5. Pair iOS ↔ desktop; correct name, icon and OS label (`pairing-api.ts:180-194` already maps `'ios' → 'iOS'`)
6. Repeat on iPad → `device_type == "tablet"`
7. Share-sheet ingest from Photos and Files, **cold and warm start** (different code paths — `load(webview:)` vs `didBecomeActive`)
8. Share a 2 GB video → extension must not OOM
9. Universal Link tap from Messages, on a **TestFlight** build
10. Background mid-transfer, return after 2 min → recovers with an honest error, does not hang
11. Local-network permission prompt appears, transfers work after granting
12. Measure direct-vs-relay connection rate — this is what decides whether the multicast entitlement is worth requesting
13. Full regression of 1–12 on a **release** build (`lto = true`, `opt-level = "s"`, `panic = "abort"`) — release-only failures are common

---

## 8. Unrelated pre-existing issues

Do not lose time to these thinking they are yours:

- **`Cargo deny` fails** with `wasm-bridge/Cargo.lock needs to be updated but --locked was passed`. Pre-existing, unrelated to iOS.
- **`docs/android-release-build.md` is gitignored** (`docs/*`), as is most of `docs/`. This file is explicitly re-included via `!docs/ios-handoff.md`.
