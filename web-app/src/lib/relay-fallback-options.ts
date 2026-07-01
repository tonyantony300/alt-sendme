import type { RelayFallback } from './relay'

export type RelayFallbackOption = {
	value: RelayFallback
	labelKey: string
	descriptionKey: string
}

export const RELAY_FALLBACK_OPTIONS: readonly RelayFallbackOption[] = [
	{
		value: 'strict',
		labelKey: 'settings.network.relay.fallbackStrict',
		descriptionKey: 'settings.network.relay.fallbackStrictDesc',
	},
	{
		value: 'public',
		labelKey: 'settings.network.relay.fallbackPublic',
		descriptionKey: 'settings.network.relay.fallbackPublicDesc',
	},
]

export function relayFallbackFromRadioValue(value: string): RelayFallback {
	return value === 'public' ? 'public' : 'strict'
}
