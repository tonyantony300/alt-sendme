#!/usr/bin/env bash
# Regenerate offline Flathub dependency manifests. From the repo root:
#   bash flatpak/build-sources.sh
set -euo pipefail

TOOLS_DIR=/tmp/flatpak-builder-tools
if [ ! -d "$TOOLS_DIR" ]; then
	git clone --depth=1 https://github.com/flatpak/flatpak-builder-tools "$TOOLS_DIR"
fi

python3 -m pip install --quiet --root-user-action=ignore aiohttp tomlkit
python3 "$TOOLS_DIR/cargo/flatpak-cargo-generator.py" \
	src-tauri/Cargo.lock -o flatpak/cargo-sources.json

python3 -m pip install --quiet --root-user-action=ignore "$TOOLS_DIR/node"
flatpak-node-generator pnpm pnpm-lock.yaml -o flatpak/node-sources.json

echo "Generated flatpak/cargo-sources.json and flatpak/node-sources.json"
