import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
	MAX_RELAY_URL_LENGTH,
	RELAY_URL_INVALID_MESSAGE_KEY,
	isValidRelayUrl,
	relayUrlValidationMessageKey,
} from './relay-url-validation.js'

describe('relay URL validation', () => {
	it('accepts HTTPS relays and local HTTP relays only', () => {
		assert.equal(isValidRelayUrl('https://relay.example.com'), true)
		assert.equal(isValidRelayUrl('http://localhost:3340'), true)
		assert.equal(isValidRelayUrl('http://127.0.0.1:3340'), true)
		assert.equal(isValidRelayUrl('http://[::1]:3340'), true)
		assert.equal(isValidRelayUrl('http://relay.example.com'), false)
	})

	it('rejects dangerous or unsupported URL schemes', () => {
		for (const url of [
			'javascript:alert(1)',
			'data:text/plain,hello',
			'ws://localhost:3340',
			'ftp://relay.example.com',
		]) {
			assert.equal(isValidRelayUrl(url), false, url)
		}
	})

	it('rejects empty, oversized, and malformed URLs', () => {
		const tooLongUrl = `https://relay.example.com/${'a'.repeat(
			MAX_RELAY_URL_LENGTH
		)}`

		assert.equal(isValidRelayUrl(''), false)
		assert.equal(isValidRelayUrl(tooLongUrl), false)
		assert.equal(isValidRelayUrl('not a url'), false)
		assert.equal(isValidRelayUrl('http://::1:3340'), false)
	})

	it('rejects embedded credentials without selecting a raw-URL message', () => {
		const url = 'https://user:secret@relay.example.com'

		assert.equal(isValidRelayUrl(url), false)
		assert.equal(relayUrlValidationMessageKey(url), RELAY_URL_INVALID_MESSAGE_KEY)
		assert.equal(
			RELAY_URL_INVALID_MESSAGE_KEY,
			'settings.network.relay.urlInvalidHint'
		)
	})
})
