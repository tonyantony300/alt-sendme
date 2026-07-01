/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_TITLE: string
	/** Injected by Vite define: TAURI_ENV_PLATFORM (e.g. "darwin", "android") */
	readonly TAURI_PLATFORM: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
	readonly glob: (
		pattern: string,
		options?: { eager?: boolean }
	) => Record<string, unknown>
}
