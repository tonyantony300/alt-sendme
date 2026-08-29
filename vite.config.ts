import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const tauriDevHost = process.env.TAURI_DEV_HOST

export default defineConfig(({ mode }) => {
	const isWeb = mode === 'web'
	const webBase = process.env.WEB_BASE ?? '/'

	return {
		plugins: [react()],
		base: isWeb ? webBase : '/',
		root: path.resolve(__dirname, './frontend'),
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './frontend/src'),
				'lottie-web': 'lottie-web/build/player/lottie_light',
				// Web-only engine: the desktop build resolves it to a stub so it
				// never pulls in the web-only frontend/src/wasm/pkg.
				'wasm-bridge-engine': isWeb
					? path.resolve(__dirname, './frontend/src/wasm/pkg/wasm_bridge.js')
					: path.resolve(__dirname, './frontend/src/wasm/wasm-bridge-stub.ts'),
			},
		},
		define: {
			'import.meta.env.VITE_APP_PLATFORM': JSON.stringify(
				isWeb ? 'web' : 'tauri'
			),
			'import.meta.env.TAURI_PLATFORM': JSON.stringify(
				process.env.TAURI_ENV_PLATFORM ?? ''
			),
			'import.meta.env.VITE_IS_FLATPAK': JSON.stringify(
				process.env.VITE_IS_FLATPAK ?? ''
			),
			'import.meta.env.VITE_ANDROID_UPDATE_CHECK': JSON.stringify(
				process.env.VITE_ANDROID_UPDATE_CHECK ?? ''
			),
		},
		// 1. prevent vite from obscuring rust errors
		clearScreen: false,
		// 2. tauri expects a fixed port, fail if that port is not available
		server: {
			port: isWeb ? 3000 : 1420,
			strictPort: true,
			host: isWeb ? false : (tauriDevHost ?? false),
			hmr:
				!isWeb && tauriDevHost
					? {
							protocol: 'ws',
							host: tauriDevHost,
							port: 1421,
						}
					: undefined,
			watch: {
				ignored: ['**/src-tauri/**'],
				usePolling: true,
			},
		},
		preview: {
			port: isWeb ? 3000 : 4173,
			strictPort: true,
		},
	}
})
