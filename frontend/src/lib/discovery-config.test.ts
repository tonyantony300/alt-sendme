import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildDiscoveryConfigArg } from './discovery-config.js'

// In the node test environment there is no `window` and no Tauri platform hint,
// so `IS_WEB` resolves to true. Custom discovery is native-only for v1, so
// buildDiscoveryConfigArg must coerce it back to the default n0 discovery here.
describe('buildDiscoveryConfigArg', () => {
	it('maps default mode to a null pkarr URL', () => {
		assert.deepEqual(
			buildDiscoveryConfigArg({
				discoveryMode: 'default',
				pkarrRelayUrl: 'https://dns.example.com/pkarr',
			}),
			{
				mode: 'default',
				pkarr_relay_url: null,
			}
		)
	})

	it('coerces custom discovery to default on web (native-only for v1)', () => {
		assert.deepEqual(
			buildDiscoveryConfigArg({
				discoveryMode: 'custom',
				pkarrRelayUrl: ' https://dns.example.com/pkarr ',
			}),
			{
				mode: 'default',
				pkarr_relay_url: null,
			}
		)
	})
})
