import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
	RELAY_FALLBACK_OPTIONS,
	relayFallbackFromRadioValue,
} from './relay-fallback-options.js'

describe('relay fallback options', () => {
	it('keeps strict first as the safe default and makes public fallback explicit', () => {
		assert.deepEqual(
			RELAY_FALLBACK_OPTIONS.map((option) => option.value),
			['strict', 'public']
		)
	})

	it('falls back to strict for unexpected radio values', () => {
		assert.equal(relayFallbackFromRadioValue('strict'), 'strict')
		assert.equal(relayFallbackFromRadioValue('public'), 'public')
		assert.equal(relayFallbackFromRadioValue('unexpected'), 'strict')
	})
})
