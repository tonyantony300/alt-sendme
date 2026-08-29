import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
	AUTO_ACCEPT_QUEUE_LIMIT,
	enqueueInvite,
	shouldAutoAccept,
	subFolderFor,
} from './auto-accept.js'

const device = (overrides = {}) => ({
	endpoint_id: 'AAAA',
	display_name: 'Studio Mac',
	pairing_status: 'active' as const,
	trusted: true,
	...overrides,
})

const invite = (blob_ticket: string) => ({
	blob_ticket,
	file_count: 1,
	total_size: 10,
	sender_name: 'Studio Mac',
	remote_endpoint_id: 'AAAA',
})

describe('shouldAutoAccept', () => {
	it('accepts a trusted, actively paired device regardless of id case', () => {
		assert.equal(shouldAutoAccept([device()], 'aaaa'), true)
		assert.equal(shouldAutoAccept([device()], ' AAAA '), true)
	})

	it('refuses an untrusted device', () => {
		assert.equal(shouldAutoAccept([device({ trusted: false })], 'aaaa'), false)
	})

	it('refuses a device that is no longer actively paired', () => {
		assert.equal(
			shouldAutoAccept(
				[device({ pairing_status: 'unpaired-remotely' })],
				'aaaa'
			),
			false
		)
		assert.equal(
			shouldAutoAccept(
				[device({ pairing_status: 'stale-local-identity' })],
				'aaaa'
			),
			false
		)
	})

	it('refuses an unknown endpoint, so Nearby senders never auto-accept', () => {
		assert.equal(shouldAutoAccept([device()], 'bbbb'), false)
		assert.equal(shouldAutoAccept([], 'aaaa'), false)
		assert.equal(shouldAutoAccept([device()], '   '), false)
	})
})

describe('enqueueInvite', () => {
	it('appends in arrival order', () => {
		const queue = enqueueInvite(enqueueInvite([], invite('a')), invite('b'))
		assert.deepEqual(
			queue.map((i) => i.blob_ticket),
			['a', 'b']
		)
	})

	it('ignores a duplicate blob ticket', () => {
		const queue = enqueueInvite([invite('a')], invite('a'))
		assert.equal(queue.length, 1)
	})

	it('drops an invite once the queue is full', () => {
		let queue: ReturnType<typeof invite>[] = []
		for (let i = 0; i < AUTO_ACCEPT_QUEUE_LIMIT; i += 1) {
			queue = enqueueInvite(queue, invite(`t${i}`))
		}
		assert.equal(queue.length, AUTO_ACCEPT_QUEUE_LIMIT)

		const overflowed = enqueueInvite(queue, invite('one-too-many'))
		assert.equal(overflowed.length, AUTO_ACCEPT_QUEUE_LIMIT)
		assert.equal(overflowed, queue)
	})
})

describe('subFolderFor', () => {
	it('prefers the locally stored device name over the advertised one', () => {
		assert.equal(
			subFolderFor([device()], 'aaaa', 'Peer Advertised'),
			'Studio Mac'
		)
	})

	it('falls back to the advertised name when the device is unknown', () => {
		assert.equal(subFolderFor([], 'aaaa', 'Peer Advertised'), 'Peer Advertised')
	})

	it('falls back when the stored name is blank', () => {
		assert.equal(
			subFolderFor(
				[device({ display_name: '   ' })],
				'aaaa',
				'Peer Advertised'
			),
			'Peer Advertised'
		)
	})
})
