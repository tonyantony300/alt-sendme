import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { shouldWarnDiscoveryChange } from './discovery-change-warning.js'

describe('shouldWarnDiscoveryChange', () => {
	it('warns when discovery mode changes to custom', () => {
		assert.equal(
			shouldWarnDiscoveryChange({
				initialMode: 'default',
				currentMode: 'custom',
			}),
			true
		)
	})

	it('does not warn when discovery mode returns to default', () => {
		assert.equal(
			shouldWarnDiscoveryChange({
				initialMode: 'custom',
				currentMode: 'default',
			}),
			false
		)
	})

	it('does not warn when discovery mode is unchanged', () => {
		assert.equal(
			shouldWarnDiscoveryChange({
				initialMode: 'custom',
				currentMode: 'custom',
			}),
			false
		)
		assert.equal(
			shouldWarnDiscoveryChange({
				initialMode: 'default',
				currentMode: 'default',
			}),
			false
		)
	})
})
