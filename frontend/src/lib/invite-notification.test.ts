import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
	buildInviteNotification,
	MAX_PEER_NAME_LENGTH,
} from './invite-notification.js'

// Echoes the key plus its interpolations so assertions read as data, not prose.
const t = (key: string, options?: Record<string, unknown>) =>
	options && Object.keys(options).length > 0
		? `${key}(${Object.entries(options)
				.map(([k, v]) => `${k}=${String(v)}`)
				.join(',')})`
		: key

const formatSize = (bytes: number) => `${bytes}B`
const deps = { t, formatSize }

describe('buildInviteNotification', () => {
	it('names the sender and file count for a paired invite', () => {
		const result = buildInviteNotification(
			'invite-paired',
			{
				blob_ticket: 't',
				file_count: 3,
				total_size: 1024,
				sender_name: 'Tony MBP',
				remote_endpoint_id: 'abc',
			},
			deps
		)
		assert.deepEqual(result, {
			title: 'common:notifications.inviteTitle(sender=Tony MBP)',
			body: 'common:notifications.inviteBody(count=3,size=1024B)',
		})
	})

	it('omits the size when total_size is zero', () => {
		const result = buildInviteNotification(
			'invite-paired',
			{
				blob_ticket: 't',
				file_count: 1,
				total_size: 0,
				sender_name: 'Tony MBP',
				remote_endpoint_id: 'abc',
			},
			deps
		)
		assert.deepEqual(result, {
			title: 'common:notifications.inviteTitle(sender=Tony MBP)',
			body: 'common:notifications.inviteBodyNoSize(count=1)',
		})
	})

	it('marks an unpaired sender as nearby', () => {
		const result = buildInviteNotification(
			'invite-nearby',
			{
				blob_ticket: 't',
				file_count: 2,
				total_size: 0,
				sender_name: 'Unknown Laptop',
				remote_endpoint_id: 'abc',
			},
			deps
		)
		assert.equal(
			result?.title,
			'common:notifications.nearbyInviteTitle(sender=Unknown Laptop)'
		)
	})

	it('builds a pair request from its own payload shape', () => {
		const result = buildInviteNotification(
			'pair-request',
			{
				remote_endpoint_id: 'abc',
				sender_name: 'Tony Phone',
				device_type: 'phone',
				os: 'android',
			},
			deps
		)
		assert.deepEqual(result, {
			title: 'common:notifications.pairRequestTitle(sender=Tony Phone)',
			body: 'common:notifications.pairRequestBody',
		})
	})

	it('builds decline and paired outcomes', () => {
		assert.deepEqual(
			buildInviteNotification(
				'invite-declined',
				{ endpoint_id: 'a', display_name: 'Tony MBP', response: 'declined' },
				deps
			),
			{
				title: 'common:notifications.declinedTitle(sender=Tony MBP)',
				body: 'common:notifications.declinedBody',
			}
		)
		assert.deepEqual(
			buildInviteNotification(
				'device-paired',
				{ display_name: 'Tony MBP' },
				deps
			),
			{
				title: 'common:notifications.pairedTitle',
				body: 'common:notifications.pairedBody(name=Tony MBP)',
			}
		)
	})

	it('falls back to the unknown-peer string when a name is missing or blank', () => {
		const result = buildInviteNotification(
			'invite-paired',
			{
				blob_ticket: 't',
				file_count: 1,
				total_size: 0,
				sender_name: '   ',
				remote_endpoint_id: 'abc',
			},
			deps
		)
		assert.equal(
			result?.title,
			'common:notifications.inviteTitle(sender=common:sender.pairedDevices.unknownPeer)'
		)
	})

	it('truncates an over-long attacker-controlled sender name', () => {
		// An unpaired LAN peer picks its own display name. Left uncapped it
		// pushes the "nearby" qualifier out of the OS banner, making a
		// stranger's invite read exactly like a paired device's.
		const hostile = 'A'.repeat(120)
		const result = buildInviteNotification(
			'invite-nearby',
			{
				blob_ticket: 't',
				file_count: 1,
				total_size: 0,
				sender_name: hostile,
				remote_endpoint_id: 'abc',
			},
			deps
		)
		const sender = result?.title.replace(
			/^common:notifications\.nearbyInviteTitle\(sender=(.*)\)$/,
			'$1'
		)
		assert.ok(sender)
		assert.equal(sender.length, MAX_PEER_NAME_LENGTH)
		assert.ok(sender.endsWith('…'))
		assert.equal(sender, `${'A'.repeat(MAX_PEER_NAME_LENGTH - 1)}…`)
	})

	it('leaves a name at exactly the cap untouched', () => {
		const exact = 'B'.repeat(MAX_PEER_NAME_LENGTH)
		const result = buildInviteNotification(
			'pair-request',
			{ remote_endpoint_id: 'abc', sender_name: exact },
			deps
		)
		assert.equal(
			result?.title,
			`common:notifications.pairRequestTitle(sender=${exact})`
		)
	})

	it('returns null for payloads that are not objects', () => {
		assert.equal(buildInviteNotification('invite-paired', null, deps), null)
		assert.equal(buildInviteNotification('pair-request', 'nope', deps), null)
	})
})
