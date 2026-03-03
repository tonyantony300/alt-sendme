import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
	type Options as NotificationOptions,
} from '@tauri-apps/plugin-notification'
import { resolveResource } from '@tauri-apps/api/path'

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

export async function sendSystemNotification(
	options: SystemNotificationOptions
): Promise<boolean> {
	if (!IS_TAURI) {
		return false
	}

	try {
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
