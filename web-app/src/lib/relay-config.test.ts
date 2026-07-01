import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildRelayConfigArg } from './relay-config.js'

describe('buildRelayConfigArg', () => {
	it('forwards normalized custom relay URLs and auth tokens in custom mode', () => {
		assert.deepEqual(
			buildRelayConfigArg({
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

	it('strips persisted custom relay endpoints and tokens outside custom mode', () => {
		assert.deepEqual(
			buildRelayConfigArg({
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

	it('strips persisted relay endpoints and tokens when relays are disabled', () => {
		assert.deepEqual(
			buildRelayConfigArg({
				relayMode: 'disabled',
				relayUrls: ['https://relay.example.com'],
				relayAuthToken: 'secret-token',
				relayFallback: 'public',
			}),
			{
				mode: 'disabled',
				urls: [],
				auth_token: null,
				fallback: 'public',
			}
		)
	})
})
