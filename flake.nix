{
  description = "DashBeam development shell (Rust + Tauri + React + WASM)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    { nixpkgs, rust-overlay, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      forAllSystems =
        f:
        nixpkgs.lib.genAttrs systems (
          system:
          f (
            import nixpkgs {
              inherit system;
              overlays = [ (import rust-overlay) ];
            }
          )
        );

      # Single source of truth for the Rust version: rust-toolchain.toml.
      # rust-overlay wants a full x.y.z, the repo pins the shorter "1.91".
      rustChannel = (builtins.fromTOML (builtins.readFile ./rust-toolchain.toml)).toolchain.channel;
      rustVersion =
        if builtins.match "[0-9]+\\.[0-9]+" rustChannel != null then "${rustChannel}.0" else rustChannel;

      # wasm-bindgen-cli must match the wasm-bindgen crate exactly or the
      # generated bindings fail at load time. Read the pin out of the lockfile
      # so the shell can warn when nixpkgs has drifted.
      wasmBindgenPin =
        let
          matches = builtins.filter (p: p.name == "wasm-bindgen") (
            (builtins.fromTOML (builtins.readFile ./wasm-bridge/Cargo.lock)).package
          );
        in
        if matches == [ ] then null else (builtins.head matches).version;
    in
    {
      devShells = forAllSystems (
        pkgs:
        let
          inherit (pkgs) lib stdenv;

          rustToolchain =
            (
              if builtins.elem rustVersion [ "stable" "beta" "nightly" ] then
                pkgs.rust-bin.${rustVersion}.latest.default
              else
                pkgs.rust-bin.stable.${rustVersion}.default
            ).override
              {
                extensions = [
                  "rust-src"
                  "rust-analyzer"
                  "clippy"
                  "rustfmt"
                ];
                # web target: pnpm build:wasm / pnpm dev:web
                targets = [ "wasm32-unknown-unknown" ];
              };

          # WebKitGTK + GTK stack that `tauri dev` links and dlopens on Linux.
          # Mirrors the apt list in .github/workflows/publish.yml.
          guiLibs = with pkgs; [
            webkitgtk_4_1
            gtk3
            glib
            libsoup_3
            cairo
            pango
            gdk-pixbuf
            at-spi2-atk
            harfbuzz
            librsvg
            libayatana-appindicator # tray-icon feature in src-tauri
            dbus # tray + notifications
            openssl
          ];

          # Icon themes and gsettings schemas the webview and file dialogs read.
          dataDirs = with pkgs; [
            "${gsettings-desktop-schemas}/share/gsettings-schemas/${gsettings-desktop-schemas.name}"
            "${gtk3}/share/gsettings-schemas/${gtk3.name}"
            "${adwaita-icon-theme}/share"
            "${hicolor-icon-theme}/share"
          ];

          linuxEnv = {
            # cargo-built binaries are not patchelf'd, so the GTK/WebKit stack
            # has to be resolvable at run time too, not just at link time.
            LD_LIBRARY_PATH = lib.makeLibraryPath guiLibs;

            # TLS in the webview (updater, relay status) needs glib-networking.
            GIO_MODULE_DIR = "${pkgs.glib-networking}/lib/gio/modules";

            # Nix's clang wrapper injects host target flags, which breaks ring's
            # wasm32 build; point the wasm32 target at the unwrapped tools.
            CC_wasm32_unknown_unknown = "${pkgs.llvmPackages.clang-unwrapped}/bin/clang";
            AR_wasm32_unknown_unknown = "${pkgs.llvmPackages.bintools-unwrapped}/bin/llvm-ar";

            # Blank/black window on NVIDIA and older Mesa. Harmless elsewhere;
            # drop it if your GPU renders the webview fine with DMA-BUF.
            WEBKIT_DISABLE_DMABUF_RENDERER = "1";
          };
        in
        {
          default = pkgs.mkShell (
            {
              name = "dashbeam";

              nativeBuildInputs =
                [
                  rustToolchain
                  pkgs.nodejs_24
                  pkgs.pnpm
                  pkgs.pkg-config
                  pkgs.wasm-bindgen-cli
                ]
                ++ lib.optionals stdenv.isLinux (
                  with pkgs;
                  [
                    gobject-introspection
                    clang # ring builds its asm for wasm32 with clang
                    llvmPackages.bintools # llvm-ar for the wasm32 target
                    patchelf # tauri bundler
                    xdg-utils # tauri bundler
                  ]
                );

              buildInputs = lib.optionals stdenv.isLinux guiLibs;

              shellHook = ''
                ${lib.optionalString stdenv.isLinux ''
                  export XDG_DATA_DIRS="${lib.concatStringsSep ":" dataDirs}''${XDG_DATA_DIRS:+:$XDG_DATA_DIRS}"
                ''}
                echo "DashBeam dev shell"
                echo "  rustc   $(rustc --version | cut -d' ' -f2) (pinned ${rustVersion} in rust-toolchain.toml)"
                echo "  node    $(node --version)"
                echo "  pnpm    $(pnpm --version)"
                ${lib.optionalString (wasmBindgenPin != null) ''
                  have_wb="$(wasm-bindgen --version 2>/dev/null | cut -d' ' -f2)"
                  if [ "$have_wb" != "${wasmBindgenPin}" ]; then
                    echo
                    echo "  warning: wasm-bindgen-cli is $have_wb, wasm-bridge/Cargo.lock pins ${wasmBindgenPin}."
                    echo "           The web target needs an exact match:"
                    echo "             cargo install wasm-bindgen-cli --version ${wasmBindgenPin} --locked"
                    echo "           (then make sure ~/.cargo/bin precedes the nix one on PATH)"
                  fi
                ''}
                echo
                echo "  pnpm install && pnpm tauri dev    desktop"
                echo "  pnpm build:wasm && pnpm dev:web   browser"
              '';
            }
            // lib.optionalAttrs stdenv.isLinux linuxEnv
          );
        }
      );
    };
}
