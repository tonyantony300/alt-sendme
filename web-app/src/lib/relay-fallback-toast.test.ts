import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { relayFallbackToastDescriptionKey } from './relay-fallback-toast.js'

describe('relayFallbackToastDescriptionKey', () => {
	it('maps known transfer fallback stages to existing localized copy', () => {
		assert.equal(
			relayFallbackToastDescriptionKey('send'),
			'footer.relay.fellBackToastSend'
		)
		assert.equal(
			relayFallbackToastDescriptionKey('receive'),
			'footer.relay.fellBackToastReceive'
		)
	})

	it('does not show public relay toast copy without an existing localized key', () => {
		assert.equal(relayFallbackToastDescriptionKey('unexpected'), null)
	})
})
