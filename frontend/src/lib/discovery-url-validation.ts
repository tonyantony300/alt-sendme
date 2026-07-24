export const MAX_DISCOVERY_URL_LENGTH = 2048
export const MAX_DNS_ORIGIN_LENGTH = 253
export const DISCOVERY_URL_INVALID_MESSAGE_KEY =
	'settings.network.discovery.urlInvalidHint'
export const DNS_ORIGIN_INVALID_MESSAGE_KEY =
	'settings.network.discovery.dnsOriginInvalidHint'

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

function isValidDnsOriginLabel(label: string): boolean {
	if (label.length === 0 || label.length > 63) return false
	if (!/^[a-z0-9]/i.test(label[0]) || !/[a-z0-9]$/i.test(label)) return false
	return /^[a-z0-9-]+$/i.test(label)
}

function hasDisallowedDnsOriginChar(value: string): boolean {
	for (const char of value) {
		const code = char.charCodeAt(0)
		// C0 controls (0x00-0x1f), DEL (0x7f), C1 controls (0x80-0x9f), and whitespace.
		if (code <= 0x1f || (code >= 0x7f && code <= 0x9f) || /\s/u.test(char)) {
			return true
		}
	}
	return false
}

/**
 * Validate an optional DNS origin hostname (e.g. `example.com`).
 * Empty string is valid (means HTTPS-only resolve). Rejects URL forms.
 */
export function isValidDnsOrigin(origin: string): boolean {
	const trimmed = origin.trim()
	if (trimmed.length === 0) return true
	if (trimmed.length > MAX_DNS_ORIGIN_LENGTH) return false
	if (hasDisallowedDnsOriginChar(trimmed)) return false
	if (
		trimmed.includes('://') ||
		trimmed.includes('/') ||
		trimmed.includes('@') ||
		trimmed.includes(':')
	) {
		return false
	}
	const withoutDot = trimmed.replace(/\.+$/, '')
	if (withoutDot.length === 0 || withoutDot === '.') return false
	return withoutDot.split('.').every(isValidDnsOriginLabel)
}

export function dnsOriginValidationMessageKey(origin: string): string | null {
	return isValidDnsOrigin(origin) ? null : DNS_ORIGIN_INVALID_MESSAGE_KEY
}
