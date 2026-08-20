import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	parseCompletionPayload,
	parseProgressPayload,
} from './transfer-events.js'

test('parses a progress payload into bytes, total and speed', () => {
	assert.deepEqual(parseProgressPayload('500:1000:1536000'), {
		bytesTransferred: 500,
		totalBytes: 1000,
		speedBps: 1536,
		percentage: 50,
		etaSeconds: 500 / 1536,
	})
})

test('reports no eta when the transfer is stalled', () => {
	const progress = parseProgressPayload('500:1000:0')
	assert.equal(progress?.speedBps, 0)
	assert.equal(progress?.etaSeconds, undefined)
})

test('caps percentage at 100 even if a payload overshoots', () => {
	const progress = parseProgressPayload('1200:1000:1000')
	assert.equal(progress?.percentage, 100)
})

test('treats a negative speed as zero rather than a negative eta', () => {
	const progress = parseProgressPayload('500:1000:-5000')
	assert.equal(progress?.speedBps, 0)
	assert.equal(progress?.etaSeconds, undefined)
})

test('rejects a payload that is not three fields', () => {
	assert.equal(parseProgressPayload('500:1000'), null)
	assert.equal(parseProgressPayload('nonsense'), null)
})

test('rejects a payload with unparsable numbers', () => {
	assert.equal(parseProgressPayload('a:b:c'), null)
})

test('reads the wire duration reported by the engine', () => {
	assert.deepEqual(
		parseCompletionPayload('{"durationMs":4200,"bytes":1000,"exportMs":800}'),
		{ durationMs: 4200, exportMs: 800 }
	)
})

test('falls back to no duration when a completion carries no payload', () => {
	assert.equal(parseCompletionPayload(undefined), null)
	assert.equal(parseCompletionPayload('not json'), null)
	assert.equal(parseCompletionPayload('{"bytes":10}'), null)
})
