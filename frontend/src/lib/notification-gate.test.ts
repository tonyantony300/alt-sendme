import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { shouldNotify } from './notification-gate.js'

describe('shouldNotify', () => {
	it('notifies when enabled and the app is in the background', () => {
		assert.equal(shouldNotify({ enabled: true, foreground: false }), true)
	})

	it('stays quiet while the user is looking at the app', () => {
		assert.equal(shouldNotify({ enabled: true, foreground: true }), false)
	})

	it('stays quiet when the user turned notifications off', () => {
		assert.equal(shouldNotify({ enabled: false, foreground: false }), false)
		assert.equal(shouldNotify({ enabled: false, foreground: true }), false)
	})
})
