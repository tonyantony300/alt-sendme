# 仓库指南

## 项目概览

AltSendme 是一个点对点文件传输应用，底层核心为 Rust crate `sendme`。本仓库同时包含：Tauri 桌面端、Web 前端/服务端，以及通过 C-ABI FFI 复用 Rust 核心的 Flutter Android 客户端。贡献流程与沟通方式请优先阅读 `CONTRIBUTING.md`。

## 目录结构与模块划分

- `src/` — Rust 核心库与 CLI/参考代码；FFI 入口在 `src/ffi.rs`
- `src-tauri/` — Tauri v2 桌面壳（Rust 后端），嵌入 `web-app/` 构建产物
- `web-app/` — Vite + React + TypeScript（Tailwind）前端
- `web-server/` — Rust (Axum) Web 服务；静态资源在 `web-server/static/`
- `mobile-app/` — Flutter Android；Dart FFI 在 `mobile-app/lib/src/native/`；Android `.so` 在 `mobile-app/android/app/src/main/jniLibs/`
- `scripts/` — 版本/发布脚本与 Android FFI 构建脚本
- `assets/` — 文档/界面用图片

## 构建、测试与开发命令

- 桌面端开发：`cd web-app && npm install`，再 `cd ../src-tauri && cargo tauri dev`
- 桌面端构建：`cd src-tauri && cargo tauri build --no-bundle`
- Web 检查：`cd web-app && npm run lint && npm run build`
- Rust 检查：`cargo fmt`、`cargo clippy -- -D warnings`、`cargo test`
- Web 服务：`cargo run --manifest-path web-server/Cargo.toml`
- Android 运行：`cd mobile-app && flutter pub get && flutter run`
- 重建 Android FFI：在仓库根执行 `./scripts/build-android-ffi.sh`
- 版本同步：`cd web-app && npm run sync-version`（pre-commit 会跑 `scripts/validate-version.js`）

## 代码风格与命名约定

- Rust：保持 `rustfmt` 干净；对外 CLI/FFI 变更需同步更新调用方；错误优先用 `anyhow::Result`
- Web：TypeScript + ESLint；组件尽量小且可复用；文件名清晰可读
- Flutter：运行 `dart format .` 与 `flutter analyze`；2 空格缩进；FFI/平台相关代码集中在 `mobile-app/lib/src/native/`

## 测试指南

- Rust：能加单测/集成测就加；运行 `cargo test`
- Flutter：Widget 测试放 `mobile-app/test/**/*_test.dart`；运行 `flutter test`
- Web：当前无专用测试框架；以 `npm run lint` + `npm run build` 作为基础门槛

## 提交与 PR 要求

- Commit 建议简短、祈使句；可使用常见前缀：`fix:`、`chore:`、`docs:`
- PR 需包含：变更说明、已运行的命令/测试、关联 issue（如有）、UI 变更截图/录屏
- 若修改 FFI/协议接口：请同步更新 Rust + Flutter/Tauri/Web，并重新生成 Android `.so`
