import { openUrl } from '@tauri-apps/plugin-opener'

export async function openExternalUrl(url: string): Promise<void> {
	if (IS_TAURI) {
		await openUrl(url)
		return
	}

	const openedWindow = window.open(url, '_blank', 'noopener,noreferrer')
	if (openedWindow) {
		openedWindow.opener = null
	}
}

export function handleExternalLinkClick(
	event: { preventDefault: () => void },
	url: string
): void {
	if (!IS_TAURI) {
		return
	}

	event.preventDefault()
	void openExternalUrl(url).catch((error) => {
		console.error('Failed to open external URL:', error)
	})
}
