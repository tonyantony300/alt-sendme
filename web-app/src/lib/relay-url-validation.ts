export const MAX_RELAY_URL_LENGTH = 2048
export const RELAY_URL_INVALID_MESSAGE_KEY =
	'settings.network.relay.urlInvalidHint'

function isLoopbackHost(hostname: string): boolean {
	return (
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname === '[::1]'
	)
}

export function isValidRelayUrl(url: string): boolean {
	if (url.length === 0 || url.length > MAX_RELAY_URL_LENGTH) return false
	let parsed: URL
	try {
		parsed = new URL(url)
	} catch {
		return false
	}
	// Require a real host and reject embedded credentials (user:pass@host).
	if (!parsed.hostname) return false
	if (parsed.username || parsed.password) return false
	// Enforce HTTPS so auth tokens are never sent in cleartext; allow plain
	// HTTP only against loopback hosts for local self-host testing.
	if (parsed.protocol === 'https:') return true
	if (parsed.protocol === 'http:' && isLoopbackHost(parsed.hostname)) return true
	return false
}

export function relayUrlValidationMessageKey(url: string): string | null {
	return isValidRelayUrl(url) ? null : RELAY_URL_INVALID_MESSAGE_KEY
}
