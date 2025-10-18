var _a, _b, _c, _d, _e, _f;
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
var host = process.env.TAURI_DEV_HOST;
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    define: {
        IS_TAURI: JSON.stringify(!!process.env.TAURI_ENV_PLATFORM),
        IS_MACOS: JSON.stringify((_b = (_a = process.env.TAURI_ENV_PLATFORM) === null || _a === void 0 ? void 0 : _a.includes('darwin')) !== null && _b !== void 0 ? _b : false),
        IS_WINDOWS: JSON.stringify((_d = (_c = process.env.TAURI_ENV_PLATFORM) === null || _c === void 0 ? void 0 : _c.includes('windows')) !== null && _d !== void 0 ? _d : false),
        IS_LINUX: JSON.stringify((_f = (_e = process.env.TAURI_ENV_PLATFORM) === null || _e === void 0 ? void 0 : _e.includes('linux')) !== null && _f !== void 0 ? _f : false),
    },
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                protocol: 'ws',
                host: host,
                port: 1421,
            }
            : undefined,
        watch: {
            // 3. tell vite to ignore watching `src-tauri`
            ignored: ['**/src-tauri/**'],
            usePolling: true
        },
    },
});
