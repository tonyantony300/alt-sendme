import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getRelayChangeWarningType } from './relay-change-warning.js'

describe('getRelayChangeWarningType', () => {
	it('warns when relay mode changes to custom or disabled', () => {
		assert.equal(
			getRelayChangeWarningType({
				initialMode: 'default',
				initialFallback: 'strict',
				currentMode: 'custom',
				currentFallback: 'strict',
			}),
			'custom'
		)
		assert.equal(
			getRelayChangeWarningType({
				initialMode: 'default',
				initialFallback: 'strict',
				currentMode: 'disabled',
				currentFallback: 'strict',
			}),
			'disabled'
		)
	})

	it('does not warn when relay mode returns to default', () => {
		assert.equal(
			getRelayChangeWarningType({
				initialMode: 'custom',
				initialFallback: 'public',
				currentMode: 'default',
				currentFallback: 'public',
			}),
			null
		)
	})

	it('warns when the custom relay fallback policy changes', () => {
		assert.equal(
			getRelayChangeWarningType({
				initialMode: 'custom',
				initialFallback: 'strict',
				currentMode: 'custom',
				currentFallback: 'public',
			}),
			'custom'
		)
	})
})
