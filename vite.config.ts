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
			},
		},
		define: {
			'import.meta.env.VITE_APP_PLATFORM': JSON.stringify(
				isWeb ? 'web' : 'tauri'
			),
			'import.meta.env.TAURI_PLATFORM': JSON.stringify(
				process.env.TAURI_ENV_PLATFORM ?? ''
			),
			// Set to 'true' by the Flatpak build so the frontend hides the updater.
			'import.meta.env.VITE_IS_FLATPAK': JSON.stringify(
				process.env.VITE_IS_FLATPAK ?? ''
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
