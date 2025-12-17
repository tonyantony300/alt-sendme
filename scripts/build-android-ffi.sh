#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/mobile-app/android/app/src/main/jniLibs"

if ! command -v cargo-ndk >/dev/null 2>&1; then
  echo "cargo-ndk not found."
  echo "Install it with: cargo install cargo-ndk"
  exit 1
fi

echo "Ensuring Rust Android targets are installed..."
rustup target add aarch64-linux-android armv7-linux-androideabi >/dev/null

echo "Building Rust FFI library into: ${OUT_DIR}"
cd "${ROOT_DIR}"

# Produces:
# - ${OUT_DIR}/arm64-v8a/libsendme.so
# - ${OUT_DIR}/armeabi-v7a/libsendme.so
cargo ndk \
  -t arm64-v8a \
  -t armeabi-v7a \
  -o "${OUT_DIR}" \
  build \
  --release \
  --features ffi

echo "Done."
