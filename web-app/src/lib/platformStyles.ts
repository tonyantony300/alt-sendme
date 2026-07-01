import { IS_LINUX, IS_MACOS, IS_TAURI, IS_WINDOWS } from './platform'

export function getPlatformAlpha(): number {
	if (!IS_TAURI) return 1

	if (IS_MACOS) return 0.4

	if (IS_WINDOWS || IS_LINUX) return 1

	return 1
}

export function initializePlatformStyles(): void {
	const root = document.documentElement

	if (IS_TAURI && IS_MACOS) {
		root.style.setProperty('--body-bg', 'transparent')
	}
}
