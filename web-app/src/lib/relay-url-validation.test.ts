import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
	RELAY_URL_INVALID_MESSAGE_KEY,
	isValidRelayUrl,
	relayUrlValidationMessageKey,
} from './relay-url-validation.js'

describe('relay URL validation', () => {
	it('accepts HTTPS relays and local HTTP relays only', () => {
		assert.equal(isValidRelayUrl('https://relay.example.com'), true)
		assert.equal(isValidRelayUrl('http://localhost:3340'), true)
		assert.equal(isValidRelayUrl('http://relay.example.com'), false)
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
