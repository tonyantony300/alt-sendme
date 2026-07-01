import type { RelayFallback, RelayMode } from './relay-config'

export type RelayChangeWarningType = 'disabled' | 'custom' | null

type RelayChangeWarningInput = {
	initialMode: RelayMode
	initialFallback: RelayFallback
	currentMode: RelayMode
	currentFallback: RelayFallback
}

export function getRelayChangeWarningType({
	initialMode,
	initialFallback,
	currentMode,
	currentFallback,
}: RelayChangeWarningInput): RelayChangeWarningType {
	if (currentMode !== initialMode) {
		return currentMode === 'disabled' || currentMode === 'custom'
			? currentMode
			: null
	}

	if (
		initialMode === 'custom' &&
		currentMode === 'custom' &&
		currentFallback !== initialFallback
	) {
		return 'custom'
	}

	return null
}
