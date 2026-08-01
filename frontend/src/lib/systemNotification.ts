import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
	type Options as NotificationOptions,
} from '@tauri-apps/plugin-notification'
import { resolveResource } from '@tauri-apps/api/path'
import { IS_TAURI, IS_WINDOWS, IS_ANDROID } from './platform'
import { useAppSettingStore } from '../store/app-setting'
import { shouldNotify } from './notification-gate'

type SystemNotificationOptions = Pick<NotificationOptions, 'title' | 'body'>

const NOTIFICATION_ICON_RESOURCE = 'icons/128x128.png'
let cachedNotificationIconPath: string | null | undefined

async function getNotificationIconPath(): Promise<string | undefined> {
	if (!IS_TAURI || IS_WINDOWS) {
		return undefined
	}

	if (cachedNotificationIconPath !== undefined) {
		return cachedNotificationIconPath ?? undefined
	}

	try {
		const iconPath = await resolveResource(NOTIFICATION_ICON_RESOURCE)
		cachedNotificationIconPath = iconPath
		return iconPath
	} catch (error) {
		console.warn('Failed to resolve notification icon resource:', error)
		cachedNotificationIconPath = null
		return undefined
	}
}

/**
 * Whether the user is currently looking at the app.
 *
 * Desktop uses the real window state — hidden-to-tray and merely-behind-
 * another-window both count as "not looking". Android's Tauri window focus
 * APIs are unreliable, and there the webview *is* the app, so page
 * visibility is the correct signal.
 */
async function isAppInForeground(): Promise<boolean> {
	if (IS_ANDROID) {
		return (
			typeof document !== 'undefined' && document.visibilityState === 'visible'
		)
	}
	const { getCurrentWindow } = await import('@tauri-apps/api/window')
	const window = getCurrentWindow()
	const [focused, visible] = await Promise.all([
		window.isFocused(),
		window.isVisible(),
	])
	return focused && visible
}

export async function sendSystemNotification(
	options: SystemNotificationOptions
): Promise<boolean> {
	if (!IS_TAURI) {
		return false
	}

	try {
		// Fail open: if the window state can't be read, a redundant
		// notification is a smaller failure than a missed one.
		let foreground = false
		try {
			foreground = await isAppInForeground()
		} catch (error) {
			console.warn('Failed to read window foreground state:', error)
		}

		if (
			!shouldNotify({
				enabled: useAppSettingStore.getState().enableNotifications,
				foreground,
			})
		) {
			return false
		}

		let granted = await isPermissionGranted()
		if (!granted) {
			const permission = await requestPermission()
			granted = permission === 'granted'
		}

		if (!granted) {
			return false
		}

		const icon = await getNotificationIconPath()
		sendNotification(icon ? { ...options, icon } : options)
		return true
	} catch (error) {
		console.error('Failed to send system notification:', error)
		return false
	}
}
