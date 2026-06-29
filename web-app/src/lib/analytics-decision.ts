export type AnalyticsPlatform = 'android' | 'desktop' | 'unknown'

export type AnalyticsDecisionOptions = {
	analyticsEnabled?: boolean
	doNotTrack: boolean
	platform: AnalyticsPlatform
}

type DoNotTrackSource = {
	doNotTrack?: string | null
	msDoNotTrack?: string | null
}

type DoNotTrackWindowSource = {
	doNotTrack?: string | null
}

export type DoNotTrackPreferenceSources = {
	navigator?: DoNotTrackSource
	window?: DoNotTrackWindowSource
}

export function analyticsPlatformFromTauriPlatform(
	platform?: string | null
): AnalyticsPlatform {
	switch (platform) {
		case 'android':
			return 'android'
		case 'darwin':
		case 'linux':
		case 'windows':
			return 'desktop'
		default:
			return 'unknown'
	}
}

export function isDoNotTrackPreferenceEnabled({
	navigator,
	window,
}: DoNotTrackPreferenceSources): boolean {
	const value =
		navigator?.doNotTrack ?? navigator?.msDoNotTrack ?? window?.doNotTrack

	return value === '1' || value === 'yes' || value === 'true'
}

export function shouldUseAnalytics({
	analyticsEnabled = false,
	doNotTrack,
	platform,
}: AnalyticsDecisionOptions): boolean {
	return analyticsEnabled === true && doNotTrack === false && platform === 'desktop'
}
