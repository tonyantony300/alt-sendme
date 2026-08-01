import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { shouldRunAutostartFirstRun } from './autostart-first-run.js'

describe('shouldRunAutostartFirstRun', () => {
	it('runs once when the store has hydrated and it has never run', () => {
		assert.equal(
			shouldRunAutostartFirstRun({ hydrated: true, initialized: false }),
			true
		)
	})

	it('does not run again once it has already run', () => {
		assert.equal(
			shouldRunAutostartFirstRun({ hydrated: true, initialized: true }),
			false
		)
	})

	it('never runs before hydration, even though the flag reads false', () => {
		// The regression this guards: the persisted flag defaults to `false`,
		// so pre-hydration every launch looks like a first launch. Acting then
		// would silently re-enable autostart on every startup for a user who
		// had turned it off.
		assert.equal(
			shouldRunAutostartFirstRun({ hydrated: false, initialized: false }),
			false
		)
		assert.equal(
			shouldRunAutostartFirstRun({ hydrated: false, initialized: true }),
			false
		)
	})
})
