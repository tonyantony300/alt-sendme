import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
	DISCOVERY_URL_INVALID_MESSAGE_KEY,
	DNS_ORIGIN_INVALID_MESSAGE_KEY,
	MAX_DISCOVERY_URL_LENGTH,
	discoveryUrlValidationMessageKey,
	dnsOriginValidationMessageKey,
	isValidDiscoveryUrl,
	isValidDnsOrigin,
} from './discovery-url-validation.js'

describe('discovery (pkarr) URL validation', () => {
	it('accepts HTTPS pkarr URLs and local HTTP only', () => {
		assert.equal(isValidDiscoveryUrl('https://dns.example.com/pkarr'), true)
		assert.equal(isValidDiscoveryUrl('http://localhost:8080/pkarr'), true)
		assert.equal(isValidDiscoveryUrl('http://127.0.0.1:8080/pkarr'), true)
		assert.equal(isValidDiscoveryUrl('http://[::1]:8080/pkarr'), true)
		assert.equal(isValidDiscoveryUrl('http://dns.example.com/pkarr'), false)
	})

	it('rejects dangerous or unsupported URL schemes', () => {
		for (const url of [
			'javascript:alert(1)',
			'data:text/plain,hello',
			'ws://localhost:8080/pkarr',
			'ftp://dns.example.com/pkarr',
		]) {
			assert.equal(isValidDiscoveryUrl(url), false, url)
		}
	})

	it('rejects empty, oversized, and malformed URLs', () => {
		const tooLongUrl = `https://dns.example.com/${'a'.repeat(
			MAX_DISCOVERY_URL_LENGTH
		)}`

		assert.equal(isValidDiscoveryUrl(''), false)
		assert.equal(isValidDiscoveryUrl(tooLongUrl), false)
		assert.equal(isValidDiscoveryUrl('not a url'), false)
	})

	it('rejects embedded credentials without selecting a raw-URL message', () => {
		const url = 'https://user:secret@dns.example.com/pkarr'

		assert.equal(isValidDiscoveryUrl(url), false)
		assert.equal(
			discoveryUrlValidationMessageKey(url),
			DISCOVERY_URL_INVALID_MESSAGE_KEY
		)
		assert.equal(
			DISCOVERY_URL_INVALID_MESSAGE_KEY,
			'settings.network.discovery.urlInvalidHint'
		)
	})
})

describe('DNS origin validation', () => {
	it('allows empty (HTTPS-only) and hostnames', () => {
		assert.equal(isValidDnsOrigin(''), true)
		assert.equal(isValidDnsOrigin('   '), true)
		assert.equal(isValidDnsOrigin('example.com'), true)
		assert.equal(isValidDnsOrigin('dns.example.com.'), true)
	})

	it('rejects URL forms and invalid labels', () => {
		assert.equal(isValidDnsOrigin('https://example.com'), false)
		assert.equal(isValidDnsOrigin('example.com/pkarr'), false)
		assert.equal(isValidDnsOrigin('example.com:53'), false)
		assert.equal(isValidDnsOrigin('-bad.example.com'), false)
		assert.equal(
			dnsOriginValidationMessageKey('https://example.com'),
			DNS_ORIGIN_INVALID_MESSAGE_KEY
		)
	})
})
