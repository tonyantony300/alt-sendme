import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
	buildGoatCounterEventUrl,
	sendGoatCounterEvent,
} from './analytics-transport.js'

type TauriConfig = {
	app: {
		security: {
			csp: Record<string, string>
			devCsp: Record<string, string>
		}
	}
}

function readTauriConfig(): TauriConfig {
	return JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8'))
}

describe('analytics transport hardening', () => {
	it('keeps remote analytics scripts blocked by the Tauri CSP', () => {
		const { app } = readTauriConfig()

		assert.equal(app.security.csp['script-src'], "'self'")
		assert.equal(app.security.devCsp['script-src'], "'self'")
		assert.match(
			app.security.csp['connect-src'],
			/https:\/\/alt-sendme\.goatcounter\.com/
		)
		assert.doesNotMatch(app.security.csp['script-src'], /goatcounter|gc\.zgo\.at/)
	})

	it('builds a fixed GoatCounter event URL without transfer details', () => {
		const url = new URL(buildGoatCounterEventUrl('transfer-complete/sender'))
		const queryKeys = [...url.searchParams.keys()].sort()

		assert.equal(url.origin, 'https://alt-sendme.goatcounter.com')
		assert.equal(url.pathname, '/count')
		assert.deepEqual(queryKeys, ['e', 'p', 'rnd', 't'])
		assert.equal(url.searchParams.get('p'), 'transfer-complete/sender')
		assert.equal(url.searchParams.get('t'), 'AltSendme transfer complete')
		assert.equal(url.searchParams.get('e'), '1')
	})

	it('uses the browser beacon transport without requiring an image fallback', () => {
		let sentUrl: string | URL | null = null
		const originalNavigator = globalThis.navigator
		Object.defineProperty(globalThis, 'navigator', {
			configurable: true,
			value: {
				sendBeacon: (url: string | URL) => {
					sentUrl = url
					return true
				},
			},
		})

		try {
			sendGoatCounterEvent('transfer-complete/receiver')

			assert.ok(sentUrl)
			const url = new URL(String(sentUrl))
			assert.equal(url.searchParams.get('p'), 'transfer-complete/receiver')
		} finally {
			Object.defineProperty(globalThis, 'navigator', {
				configurable: true,
				value: originalNavigator,
			})
		}
	})
})
