// VITE_APP_PLATFORM is a build-time hint (tauri vs web).
// TAURI_PLATFORM is injected by Vite define from TAURI_ENV_PLATFORM (OS target when on Tauri).
// Runtime detection wins: a plain browser must never call Tauri APIs even if the wrong
// dev script or env file was used (e.g. opening the Tauri Vite port in Safari).
const appPlatform = import.meta.env.VITE_APP_PLATFORM ?? ''
const platform = import.meta.env.TAURI_PLATFORM ?? ''

function isTauriRuntime(): boolean {
	if (typeof window === 'undefined') {
		return appPlatform === 'tauri'
	}

	const w = window as Window & {
		__TAURI_INTERNALS__?: unknown
		__TAURI__?: unknown
	}

	return w.__TAURI_INTERNALS__ != null || w.__TAURI__ != null
}

export const IS_TAURI = isTauriRuntime()
export const IS_WEB = !IS_TAURI
export const IS_ANDROID = IS_TAURI && platform.includes('android')
export const IS_MACOS = IS_TAURI && platform.includes('darwin')
export const IS_WINDOWS = IS_TAURI && platform.includes('windows')
export const IS_LINUX = IS_TAURI && platform.includes('linux')

// Set by the Flatpak build; the in-app updater is disabled there (OS handles it).
export const IS_FLATPAK = IS_TAURI && import.meta.env.VITE_IS_FLATPAK === 'true'
