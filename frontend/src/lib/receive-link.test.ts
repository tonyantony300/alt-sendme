import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
	buildReceiveLink,
	formatReceiveShareMessage,
	ticketFromReceiveLink,
} from './receive-link.js'

describe('receive links', () => {
	it('round-trips an opaque ticket through the public receive URL', () => {
		const ticket = 'blob-ticket/with + symbols'
		const link = buildReceiveLink(ticket)

		assert.equal(
			link,
			'https://app.dashbeam.net/receive?ticket=blob-ticket%2Fwith+%2B+symbols'
		)
		assert.equal(ticketFromReceiveLink(link), ticket)
	})

	it('uses the current web deployment origin when supplied', () => {
		assert.equal(
			buildReceiveLink('ticket', 'http://localhost:1420'),
			'http://localhost:1420/receive?ticket=ticket'
		)
	})

	it('formats a soft-brand share message with the URL alone on its line', () => {
		assert.equal(
			formatReceiveShareMessage(
				'Private transfer - Sent with DashBeam',
				'https://app.dashbeam.net/receive?ticket=abc'
			),
			'Private transfer - Sent with DashBeam\n\nhttps://app.dashbeam.net/receive?ticket=abc'
		)
	})

	it('extracts a ticket from a soft-brand share paste', () => {
		const ticket = 'blobabc'
		const message = formatReceiveShareMessage(
			'Private transfer - Sent with DashBeam',
			buildReceiveLink(ticket)
		)
		assert.equal(ticketFromReceiveLink(message), ticket)
	})

	it('ignores unrelated and malformed URLs', () => {
		assert.equal(ticketFromReceiveLink('https://app.dashbeam.net/'), null)
		assert.equal(
			ticketFromReceiveLink(
				'https://app.dashbeam.net/settings?ticket=should-not-load'
			),
			null
		)
		assert.equal(ticketFromReceiveLink('not a URL'), null)
	})
})
