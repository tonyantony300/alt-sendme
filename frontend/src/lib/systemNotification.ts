import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
	type Options as NotificationOptions,
} from '@tauri-apps/plugin-notification'
import { resolveResource } from '@tauri-apps/api/path'
import { IS_TAURI, IS_WINDOWS, IS_ANDROID, IS_DESKTOP } from './platform'
import { invoke } from './platform-api'
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

let permissionBootstrapped = false

/**
 * Ask for notification permission once, at a moment the app is on screen.
 *
 * `sendSystemNotification` cannot do this itself: its foreground/settings
 * gate suppresses whenever the app *is* on screen, so any request made from
 * there necessarily happens while the app is backgrounded. On desktop that is
 * harmless (the plugin grants unconditionally), but on Android it maps to the
 * real `POST_NOTIFICATIONS` runtime dialog, which a non-resumed Activity
 * cannot show — the promise stalls and the notification is lost.
 *
 * Call this from a mounted component so the prompt lands while the user is
 * looking at the app. Safe to call repeatedly; it runs at most once per
 * session and never throws.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
	if (!IS_TAURI || permissionBootstrapped) {
		return false
	}
	permissionBootstrapped = true

	try {
		if (await isPermissionGranted()) {
			return true
		}
		return (await requestPermission()) === 'granted'
	} catch (error) {
		console.warn('Failed to bootstrap notification permission:', error)
		return false
	}
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

		// Fallback for the case where `ensureNotificationPermission` never ran.
		// It normally has, from a foreground moment — see its doc comment for
		// why requesting from here is a bad moment on Android.
		let granted = await isPermissionGranted()
		if (!granted) {
			const permission = await requestPermission()
			granted = permission === 'granted'
		}

		if (!granted) {
			return false
		}

		const icon = await getNotificationIconPath()
		// Desktop: plugin uses the OS default timeout (often ~2s). Our command
		// sets Timeout::Never (Linux until dismissed; Windows longest toast).
		// Android keeps the plugin path.
		if (IS_DESKTOP) {
			await invoke('show_system_notification', {
				title: options.title,
				body: options.body,
				icon,
			})
		} else {
			sendNotification(icon ? { ...options, icon } : options)
		}
		return true
	} catch (error) {
		console.error('Failed to send system notification:', error)
		return false
	}
}
