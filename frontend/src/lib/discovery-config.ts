import { IS_WEB } from './platform.js'

export type DiscoveryMode = 'default' | 'custom'

export type DiscoveryConfigArg = {
	mode: DiscoveryMode
	pkarr_relay_url?: string | null
	dns_origin?: string | null
}

export type DiscoveryConfigInput = {
	discoveryMode: DiscoveryMode
	pkarrRelayUrl: string
	dnsOrigin?: string
}

/**
 * Custom discovery (a self-hosted pkarr relay) is only wired up on native
 * platforms for v1. On web we always fall back to the default n0 discovery.
 */
export function effectiveDiscoveryMode(
	discoveryMode: DiscoveryMode
): DiscoveryMode {
	return IS_WEB ? 'default' : discoveryMode
}

export function buildDiscoveryConfigArg({
	discoveryMode,
	pkarrRelayUrl,
	dnsOrigin = '',
}: DiscoveryConfigInput): DiscoveryConfigArg {
	const mode = effectiveDiscoveryMode(discoveryMode)
	const trimmedOrigin = dnsOrigin.trim()

	return {
		mode,
		pkarr_relay_url: mode === 'custom' ? pkarrRelayUrl.trim() : null,
		dns_origin:
			mode === 'custom' && trimmedOrigin.length > 0 ? trimmedOrigin : null,
	}
}
