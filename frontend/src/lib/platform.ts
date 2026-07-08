// VITE_APP_PLATFORM is a build-time hint (tauri vs web).
// TAURI_PLATFORM is injected by Vite define from TAURI_ENV_PLATFORM (OS target when on Tauri).
// Runtime detection wins: a plain browser must never call Tauri APIs even if the wrong
// dev script or env file was used (e.g. opening the Tauri Vite port in Safari).
//
// `import.meta.env` is undefined under plain Node (lib unit tests). Vite replaces
// these identifiers at build time; optional chaining keeps the Node path safe.
const appPlatform = import.meta.env?.VITE_APP_PLATFORM ?? ''
const platform = import.meta.env?.TAURI_PLATFORM ?? ''

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
export const IS_IOS = IS_TAURI && platform.includes('ios')
export const IS_MOBILE = IS_ANDROID || IS_IOS
export const IS_MACOS = IS_TAURI && platform.includes('darwin')
export const IS_WINDOWS = IS_TAURI && platform.includes('windows')
export const IS_LINUX = IS_TAURI && platform.includes('linux')
export const IS_DESKTOP =
	IS_TAURI && !IS_MOBILE && (IS_MACOS || IS_WINDOWS || IS_LINUX)
/** Persistent pairing node (host/join/invite) — desktop apps and Android. */
export const IS_PAIRING_CAPABLE = IS_DESKTOP || IS_ANDROID

// Baked in at build time by the Flatpak build (VITE_IS_FLATPAK=true). The in-app
// updater is disabled in Flatpak, so UI and update checks key off this flag.
export const IS_FLATPAK = IS_TAURI && import.meta.env.VITE_IS_FLATPAK === 'true'
