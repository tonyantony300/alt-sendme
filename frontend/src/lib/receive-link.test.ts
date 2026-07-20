import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildReceiveLink, ticketFromReceiveLink } from './receive-link.js'

describe('receive links', () => {
	it('round-trips an opaque ticket through the public receive URL', () => {
		const ticket = 'blob-ticket/with + symbols'
		const link = buildReceiveLink(ticket)

		assert.equal(
			link,
			'https://app.altsendme.com/receive?ticket=blob-ticket%2Fwith+%2B+symbols'
		)
		assert.equal(ticketFromReceiveLink(link), ticket)
	})

	it('ignores unrelated and malformed URLs', () => {
		assert.equal(ticketFromReceiveLink('https://app.altsendme.com/'), null)
		assert.equal(ticketFromReceiveLink('not a URL'), null)
	})
})
