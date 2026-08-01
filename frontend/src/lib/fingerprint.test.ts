import assert from 'node:assert/strict'
import { test } from 'node:test'
import { shortFingerprint } from './fingerprint.js'

test('formats as three groups of four', () => {
	const id = '00'.repeat(32)
	assert.equal(shortFingerprint(id), 'AAAA-AAAA-AAAA')
})

test('is uppercase base32 and grouped', () => {
	const id = 'ff'.repeat(32)
	const fp = shortFingerprint(id)
	assert.ok(fp)
	assert.equal(fp.length, 14, '12 chars plus 2 dashes')
	assert.equal((fp.match(/-/g) ?? []).length, 2)
	assert.ok(/^[A-Z2-7-]+$/.test(fp), `base32 alphabet is A-Z and 2-7: ${fp}`)
})

test('is deterministic', () => {
	const id = 'a1b2c3d4'.repeat(8)
	assert.equal(shortFingerprint(id), shortFingerprint(id))
})

test('distinct keys give distinct fingerprints', () => {
	// Vary an EARLY byte. The fingerprint is the first 60 bits of a 256-bit
	// key, so keys differing only in a late byte collide by construction —
	// that is inherent to truncation, not a defect.
	const a = '00'.repeat(32)
	const b = `01${'00'.repeat(31)}`
	assert.notEqual(shortFingerprint(a), shortFingerprint(b))
})

test('rejects wrong length', () => {
	assert.equal(shortFingerprint('00'.repeat(16)), null)
	assert.equal(shortFingerprint('00'.repeat(64)), null)
})

test('rejects non-hex', () => {
	assert.equal(shortFingerprint('zz'.repeat(32)), null)
})

test('tolerates surrounding whitespace', () => {
	const id = `  ${'00'.repeat(32)}  `
	assert.equal(shortFingerprint(id), 'AAAA-AAAA-AAAA')
})
