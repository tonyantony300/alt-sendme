import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isReceiveSessionBusy } from './receive-session.js'

const state = (overrides = {}) => ({
	isReceiving: false,
	isTransporting: false,
	isCompleted: false,
	isExportPending: false,
	...overrides,
})

describe('isReceiveSessionBusy', () => {
	it('is idle before anything starts', () => {
		assert.equal(isReceiveSessionBusy(state()), false)
	})

	it('is busy while connecting and while bytes move', () => {
		assert.equal(isReceiveSessionBusy(state({ isReceiving: true })), true)
		assert.equal(
			isReceiveSessionBusy(state({ isReceiving: true, isTransporting: true })),
			true
		)
	})

	it('is idle once the transfer completes, even though the success screen stays up', () => {
		// `isReceiving` also drives the view switch in Receiver.tsx, so it stays
		// true until the user clicks Done. That must not block the next transfer.
		assert.equal(
			isReceiveSessionBusy(state({ isReceiving: true, isCompleted: true })),
			false
		)
	})

	it('stays busy through the Android export that runs after completion', () => {
		assert.equal(
			isReceiveSessionBusy(
				state({ isReceiving: true, isCompleted: true, isExportPending: true })
			),
			true
		)
	})

	it('is busy if bytes are still moving despite a completion flag', () => {
		assert.equal(
			isReceiveSessionBusy(
				state({ isReceiving: true, isCompleted: true, isTransporting: true })
			),
			true
		)
	})
})
