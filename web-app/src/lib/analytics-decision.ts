export type AnalyticsPlatform = 'android' | 'desktop'

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
	return analyticsEnabled === true && doNotTrack === false && platform !== 'android'
}
