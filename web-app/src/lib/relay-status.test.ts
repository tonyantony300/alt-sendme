import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildRelayStatusConfig } from './relay-status.js'

describe('buildRelayStatusConfig', () => {
	it('forwards custom relay auth tokens for authenticated status checks', () => {
		assert.deepEqual(
			buildRelayStatusConfig({
				relayMode: 'custom',
				relayUrls: [' https://relay.example.com ', ' '],
				relayAuthToken: 'secret-token',
				relayFallback: 'public',
			}),
			{
				mode: 'custom',
				urls: ['https://relay.example.com'],
				auth_token: 'secret-token',
				fallback: 'public',
			}
		)
	})

	it('omits custom relay URLs and auth tokens outside custom relay mode', () => {
		assert.deepEqual(
			buildRelayStatusConfig({
				relayMode: 'default',
				relayUrls: ['https://relay.example.com'],
				relayAuthToken: 'secret-token',
				relayFallback: 'strict',
			}),
			{
				mode: 'default',
				urls: [],
				auth_token: null,
				fallback: 'strict',
			}
		)
	})
})
