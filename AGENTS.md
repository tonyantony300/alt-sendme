# Repository Guidelines

## Project Overview

AltSendme is a peer-to-peer file transfer app built around a Rust core (`sendme`). This repo includes a Tauri desktop app, a web frontend/server, and an Android Flutter client that reuses the Rust core via C-ABI FFI.

For community/process details, also see `CONTRIBUTING.md`.

## Project Structure & Module Organization

- `src/` — Rust core library + CLI/reference code (`sendme` crate). FFI entrypoints live in `src/ffi.rs`.
- `src-tauri/` — Tauri v2 desktop shell (Rust backend) that embeds the frontend from `web-app/`.
- `web-app/` — Vite + React + TypeScript UI (Tailwind); builds the assets consumed by Tauri.
- `web-server/` — Rust (Axum) server; static assets in `web-server/static/`.
- `mobile-app/` — Flutter Android app; Dart FFI bindings in `mobile-app/lib/src/native/`; Android `.so` files in `mobile-app/android/app/src/main/jniLibs/`.
- `scripts/` — release/version tooling + Android FFI build script.
- `assets/` — images used in docs/UI.

## Build, Test, and Development Commands

- Desktop (Tauri) dev: `cd web-app && npm install` then `cd ../src-tauri && cargo tauri dev`
- Desktop build: `cd src-tauri && cargo tauri build --no-bundle`
- Web app checks: `cd web-app && npm run lint` and `npm run build`
- Rust checks: `cargo fmt` / `cargo clippy -- -D warnings` / `cargo test`
- Web server: `cargo run --manifest-path web-server/Cargo.toml`
- Android (Flutter): `cd mobile-app && flutter pub get && flutter run`
- Android FFI rebuild (repo root): `./scripts/build-android-ffi.sh`
- Version sync: `cd web-app && npm run sync-version` (pre-commit runs `scripts/validate-version.js`)

## Coding Style & Naming Conventions

- Rust: keep code `rustfmt`-clean; prefer fallible APIs via `anyhow`/`Result`; avoid breaking public CLI/FFI without coordinating updates.
- Web: TypeScript + ESLint (`web-app/`); keep components small and reusable; prefer descriptive filenames.
- Flutter: `dart format .` + `flutter analyze`; 2-space indentation; keep platform/FFI code in `mobile-app/lib/src/native/`.

## Testing Guidelines

- Rust: add unit/integration tests where feasible; run `cargo test`.
- Flutter: add `flutter_test` widget tests under `mobile-app/test/`; run `flutter test`.
- Web: no dedicated test runner here; treat `npm run lint` + `npm run build` as the baseline gate.

## Commit & Pull Request Guidelines

- Prefer short, imperative commit subjects; conventional prefixes are welcome (`fix: …`, `chore: …`, `docs: …`).
- PRs include: summary, test evidence (commands run), linked issues, and screenshots/screen recordings for UI changes.
- If you change FFI/protocol surfaces, update all affected clients (Rust + Flutter/Tauri/web) and regenerate Android `.so` outputs.
