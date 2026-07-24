import type { DiscoveryMode } from './discovery-config'

type DiscoveryChangeWarningInput = {
	initialMode: DiscoveryMode
	currentMode: DiscoveryMode
}

/** Warn when the user newly opts into custom (self-hosted) discovery. */
export function shouldWarnDiscoveryChange({
	initialMode,
	currentMode,
}: DiscoveryChangeWarningInput): boolean {
	return currentMode !== initialMode && currentMode === 'custom'
}
