import {
	type AnalyticsPlatform,
	isDoNotTrackPreferenceEnabled,
	shouldUseAnalytics,
} from './analytics-decision'
import { sendGoatCounterEvent } from './analytics-transport'
import { useAppSettingStore } from '../store/app-setting'

function getAnalyticsPlatform(): AnalyticsPlatform {
	return import.meta.env.TAURI_PLATFORM === 'android' ? 'android' : 'desktop'
}

function isDoNotTrackEnabled(): boolean {
	return isDoNotTrackPreferenceEnabled({
		navigator:
			typeof navigator === 'undefined'
				? undefined
				: (navigator as Navigator & { msDoNotTrack?: string | null }),
		window:
			typeof window === 'undefined'
				? undefined
				: (window as Window & { doNotTrack?: string | null }),
	})
}

export function canUseAnalytics(): boolean {
	return shouldUseAnalytics({
		analyticsEnabled: useAppSettingStore.getState().analyticsEnabled,
		doNotTrack: isDoNotTrackEnabled(),
		platform: getAnalyticsPlatform(),
	})
}

/** No-op on Android; analytics are disabled for the mobile build. */
export function trackTransferComplete(
	_fileSizeBytes: number,
	role: 'sender' | 'receiver',
	_durationMs: number = 0
): void {
	if (!canUseAnalytics() || typeof window === 'undefined') {
		return
	}

	try {
		sendGoatCounterEvent(`transfer-complete/${role}`)
	} catch (_error) {}
}
