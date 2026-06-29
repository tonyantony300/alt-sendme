import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { buildGoatCounterEventUrl } from './analytics-transport.js'

describe('analytics transport hardening', () => {
	it('does not load GoatCounter remote script into the Tauri renderer', () => {
		const initAnalyticsSource = readFileSync(
			'web-app/src/lib/initAnalytics.ts',
			'utf8'
		)
		const tauriConfig = readFileSync('src-tauri/tauri.conf.json', 'utf8')

		assert.equal(initAnalyticsSource.includes('gc.zgo.at/count.js'), false)
		assert.equal(
			tauriConfig.includes('script-src') && tauriConfig.includes('gc.zgo.at'),
			false
		)
	})

	it('builds a fixed GoatCounter event URL without transfer details', () => {
		const url = new URL(buildGoatCounterEventUrl('transfer-complete/sender'))

		assert.equal(url.origin, 'https://alt-sendme.goatcounter.com')
		assert.equal(url.pathname, '/count')
		assert.equal(url.searchParams.get('p'), 'transfer-complete/sender')
		assert.equal(url.searchParams.get('e'), '1')
		assert.equal(url.searchParams.has('fileSize'), false)
		assert.equal(url.searchParams.has('duration'), false)
	})

	it('does not use an image pixel fallback outside connect-src controls', () => {
		const analyticsTransportSource = readFileSync(
			'web-app/src/lib/analytics-transport.ts',
			'utf8'
		)

		assert.equal(analyticsTransportSource.includes('new Image'), false)
	})

	it('does not interpolate raw relay URLs into invalid URL toasts', () => {
		const relaySettingsSource = readFileSync(
			'web-app/src/components/settings/relay/relay-settings.tsx',
			'utf8'
		)

		assert.equal(relaySettingsSource.includes("invalidUrl', { url:"), false)
	})
})
