export const MAX_DISCOVERY_URL_LENGTH = 2048
export const DISCOVERY_URL_INVALID_MESSAGE_KEY =
	'settings.network.discovery.urlInvalidHint'

function isLoopbackHost(hostname: string): boolean {
	return (
		hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
	)
}

/**
 * Validate a self-hosted pkarr relay URL (e.g. `https://dns.example.com/pkarr`).
 * Mirrors the relay URL rules: HTTPS is required except for loopback hosts, and
 * embedded credentials are rejected.
 */
export function isValidDiscoveryUrl(url: string): boolean {
	if (url.length === 0 || url.length > MAX_DISCOVERY_URL_LENGTH) return false
	let parsed: URL
	try {
		parsed = new URL(url)
	} catch {
		return false
	}
	if (!parsed.hostname) return false
	if (parsed.username || parsed.password) return false
	if (parsed.protocol === 'https:') return true
	if (parsed.protocol === 'http:' && isLoopbackHost(parsed.hostname))
		return true
	return false
}

export function discoveryUrlValidationMessageKey(url: string): string | null {
	return isValidDiscoveryUrl(url) ? null : DISCOVERY_URL_INVALID_MESSAGE_KEY
}
