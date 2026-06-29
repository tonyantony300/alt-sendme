import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { relayAuthTokenForIpc } from './relay-auth-token.js'

describe('relayAuthTokenForIpc', () => {
	it('omits absent relay auth tokens', () => {
		assert.equal(relayAuthTokenForIpc(''), null)
	})

	it('preserves explicitly entered token text for backend validation', () => {
		assert.equal(relayAuthTokenForIpc(' \t\n '), ' \t\n ')
		assert.equal(relayAuthTokenForIpc(' secret '), ' secret ')
		assert.equal(relayAuthTokenForIpc('secret-token'), 'secret-token')
	})
})
