#!/usr/bin/env bash
# Regenerates the offline dependency manifests Flathub needs (its build has no
# network). Run inside the Fedora container from the repo root:
#   bash flatpak/build-sources.sh
set -euo pipefail

TOOLS_DIR=/tmp/flatpak-builder-tools
if [ ! -d "$TOOLS_DIR" ]; then
	git clone --depth=1 https://github.com/flatpak/flatpak-builder-tools "$TOOLS_DIR"
fi

python3 -m pip install --quiet aiohttp toml

# Rust: src-tauri/Cargo.lock already includes the engine workspace's crates.
python3 "$TOOLS_DIR/cargo/flatpak-cargo-generator.py" \
	src-tauri/Cargo.lock -o flatpak/cargo-sources.json

# pnpm: vendor every package from the workspace lockfile.
python3 "$TOOLS_DIR/node/flatpak-node-generator.py" pnpm \
	pnpm-lock.yaml -o flatpak/node-sources.json

echo "Generated flatpak/cargo-sources.json and flatpak/node-sources.json"
