# AltSendme Mobile (Android, Flutter)

This folder contains an Android app written in Dart/Flutter. The networking/core logic is reused from the existing Rust `sendme` crate via a small C-ABI FFI layer (`--features ffi`) and loaded from Flutter with `dart:ffi`.

## Quick start (Android)

### 1) Prerequisites

- Flutter SDK installed (this repo was created with Flutter 3.35+)
- Android SDK + NDK installed (Android Studio is the easiest way)
- Rust toolchain installed

### 2) Build the Rust native library (.so)

From the repo root:

```bash
./scripts/build-android-ffi.sh
```

This generates `libsendme.so` into:

- `mobile-app/android/app/src/main/jniLibs/arm64-v8a/`
- `mobile-app/android/app/src/main/jniLibs/armeabi-v7a/`

### 3) Run the Flutter app

```bash
cd mobile-app
flutter run
```

## Current scope / limitations

- Supports **file** picking (not directory sharing yet)
- Receives into the app’s documents directory (no Download/SAF destination picker yet)
- Progress events are not wired up to Dart yet (FFI API currently exposes only the core operations)

