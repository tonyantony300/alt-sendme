# Contributing to DashBeam

Thank you for your interest in contributing. This guide covers local setup and how to submit changes.

## Development setup

**Prerequisites:** Rust 1.91+, Node.js 20+, pnpm 10+

```bash
git clone https://github.com/tonyantony300/dashbeam.git
cd dashbeam
pnpm install
```

### Desktop

```bash
pnpm tauri dev
```

Production build (skips installer/bundle packaging):

```bash
pnpm tauri build --no-bundle
```

### Web app setup

Use the web target to run the app in a browser during development.

Start the web dev server:

```bash
pnpm build:wasm   
pnpm dev:web
```

Open `http://localhost:3000/`.

Production web build:

```bash
pnpm build:web
pnpm preview:web
```

### Android

```bash
pnpm android:dev
```

### Project layout

| Path | Purpose |
|------|---------|
| `frontend/` | React UI (Tauri + web targets) |
| `src-tauri/` | Tauri desktop/Android shell |
| `engine/` | Rust P2P transfer engine |
| `www/` | Public Next.js site (planned) |

## Testing

To exercise transfers on a single machine, install the [Sendme CLI](https://www.iroh.computer/sendme) and share files locally — traffic stays on your device.

Engine E2E tests:

```bash
cargo test --manifest-path engine/Cargo.toml
```

## Pull requests

1. Search [existing issues](https://github.com/tonyantony300/dashbeam/issues) before opening a new one.
2. For bugs, use the [bug report template](.github/ISSUE_TEMPLATE/report-bug.md).
3. Run checks before opening a PR:

```bash
pnpm lint
pnpm format
```

4. Fill out the [pull request template](.github/PULL_REQUEST_TEMPLATE.md).

**Lockfiles:** Do not commit lockfile-only changes. CI rejects PRs that modify `pnpm-lock.yaml` or `Cargo.lock` without a corresponding manifest change.

```bash
git checkout origin/main -- pnpm-lock.yaml src-tauri/Cargo.lock engine/Cargo.lock
```

## Getting help

- [Discord](https://discord.gg/xwb7z22Eve)
- [GitHub Issues](https://github.com/tonyantony300/dashbeam/issues)


Please be respectful and considerate in all project spaces.