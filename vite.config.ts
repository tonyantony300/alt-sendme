import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const host = process.env.TAURI_DEV_HOST

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	root: path.resolve(__dirname, './web-app'),
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './web-app/src'),
		},
	},
	define: {
		// Single string so platform.ts can derive flags; Vite replaces import.meta.env reliably
		'import.meta.env.TAURI_PLATFORM': JSON.stringify(
			process.env.TAURI_ENV_PLATFORM ?? ''
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
			usePolling: true,
		},
	},
})
