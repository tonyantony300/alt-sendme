const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/**
 * TS port of `protocol::identity::short_fingerprint`. Both sides derive this
 * locally from the endpoint id, with no round trip, so they can be compared on
 * screen. Keep it in lockstep with the Rust version — a divergence makes two
 * honest devices show different codes.
 *
 * 12 base32 chars = 60 bits, truncated from a uniform public key, no hashing.
 * `null` for anything that isn't a 64-character hex endpoint id.
 */
export function shortFingerprint(endpointIdHex: string): string | null {
	const trimmed = endpointIdHex.trim().toLowerCase()
	if (!/^[0-9a-f]{64}$/.test(trimmed)) return null

	const bytes = new Uint8Array(32)
	for (let i = 0; i < 32; i++) {
		bytes[i] = Number.parseInt(trimmed.slice(i * 2, i * 2 + 2), 16)
	}

	let bitBuffer = ''
	let chars = ''
	for (const byte of bytes) {
		bitBuffer += byte.toString(2).padStart(8, '0')
		while (bitBuffer.length >= 5 && chars.length < 12) {
			chars += BASE32_ALPHABET[Number.parseInt(bitBuffer.slice(0, 5), 2)]
			bitBuffer = bitBuffer.slice(5)
		}
		if (chars.length >= 12) break
	}

	return (chars.match(/.{1,4}/g) ?? []).join('-')
}
