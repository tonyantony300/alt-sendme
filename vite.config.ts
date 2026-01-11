import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const host = process.env.TAURI_DEV_HOST

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
    IS_MACOS: JSON.stringify(
      process.env.TAURI_ENV_PLATFORM?.includes('darwin') ?? false
    ),
    IS_WINDOWS: JSON.stringify(
      process.env.TAURI_ENV_PLATFORM?.includes('windows') ?? false
    ),
    IS_LINUX: JSON.stringify(
      process.env.TAURI_ENV_PLATFORM?.includes('linux') ?? false
    ),
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
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
      usePolling: true
    },
  },
})
