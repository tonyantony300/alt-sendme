import assert from 'node:assert/strict'
import { test } from 'node:test'
import { matchLocale } from './locale-match.js'

const LOCALES = [
	'de',
	'en',
	'km',
	'ko',
	'no',
	'pt-BR',
	'uz-Latn',
	'zh-CN',
	'zh-TW',
]

test('exact tag wins, case-insensitively', () => {
	assert.equal(matchLocale('zh-tw', LOCALES), 'zh-TW')
	assert.equal(matchLocale('pt-BR', LOCALES), 'pt-BR')
})

test('falls back to the base language subtag', () => {
	assert.equal(matchLocale('de-AT', LOCALES), 'de')
	assert.equal(matchLocale('pt-PT', LOCALES), 'pt-BR')
	assert.equal(matchLocale('uz', LOCALES), 'uz-Latn')
	assert.equal(matchLocale('zh', LOCALES), 'zh-CN')
})

test('three-letter codes do not match two-letter prefixes', () => {
	assert.equal(matchLocale('kok', LOCALES), undefined)
	assert.equal(matchLocale('kmr', LOCALES), undefined)
	assert.equal(matchLocale('jam', ['ja', 'en']), undefined)
})

test('aliases cover Norwegian and Traditional Chinese', () => {
	assert.equal(matchLocale('nb-NO', LOCALES), 'no')
	assert.equal(matchLocale('nn', LOCALES), 'no')
	assert.equal(matchLocale('zh-HK', LOCALES), 'zh-TW')
	assert.equal(matchLocale('zh-Hant-HK', LOCALES), 'zh-TW')
	assert.equal(matchLocale('zh-Hans-HK', LOCALES), 'zh-CN')
})

test('unknown or empty tags return undefined', () => {
	assert.equal(matchLocale('sw-KE', LOCALES), undefined)
	assert.equal(matchLocale('', LOCALES), undefined)
	assert.equal(matchLocale(undefined, LOCALES), undefined)
})
