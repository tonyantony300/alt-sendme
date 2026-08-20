import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
	filterTransferHistory,
	formatTransferDuration,
	formatTransferSpeed,
	resolvePeerLabel,
	summarizeTransferItems,
} from './transfer-history.js'
import type { TransferRecord } from './transfer-history.js'

function record(overrides: Partial<TransferRecord> = {}): TransferRecord {
	return {
		id: 'id-1',
		direction: 'send',
		status: 'completed',
		startedAt: 1_000,
		payloadBytes: 1_024,
		bytesTransferred: 1_024,
		itemCount: 1,
		rootName: 'report.pdf',
		fileNames: [],
		fileNamesTruncated: false,
		peerCount: 1,
		conflictCount: 0,
		...overrides,
	}
}

describe('filterTransferHistory', () => {
	it('keeps both directions in one list', () => {
		const sent = record({ id: 'sent', direction: 'send' })
		const received = record({ id: 'received', direction: 'receive' })

		const result = filterTransferHistory([sent, received], 'all')

		assert.deepEqual(
			result.map((r) => r.id),
			['sent', 'received']
		)
	})

	it('keeps only the requested status', () => {
		const done = record({ id: 'done', status: 'completed' })
		const broken = record({ id: 'broken', status: 'interrupted' })

		const result = filterTransferHistory([done, broken], 'interrupted')

		assert.deepEqual(
			result.map((r) => r.id),
			['broken']
		)
	})

	it('filters by status across both directions at once', () => {
		const records = [
			record({ id: 'a', direction: 'send', status: 'failed' }),
			record({ id: 'b', direction: 'receive', status: 'failed' }),
			record({ id: 'c', direction: 'send', status: 'completed' }),
		]

		const result = filterTransferHistory(records, 'failed')

		assert.deepEqual(
			result.map((r) => r.id),
			['a', 'b']
		)
	})

	it('passes every status through when no status is selected', () => {
		const records = [
			record({ id: 'a', status: 'completed' }),
			record({ id: 'b', status: 'failed' }),
			record({ id: 'c', status: 'cancelled' }),
		]

		const result = filterTransferHistory(records, 'all')

		assert.equal(result.length, 3)
	})
})

describe('resolvePeerLabel', () => {
	const paired = [{ endpoint_id: 'ABC123', display_name: 'Tony’s Laptop' }]

	it('prefers the current device name over the name stored at transfer time', () => {
		const row = record({
			peer: { endpointId: 'abc123', displayName: 'Old Name' },
		})

		assert.equal(resolvePeerLabel(row, paired), 'Tony’s Laptop')
	})

	it('falls back to the stored name once the device is forgotten', () => {
		const row = record({
			peer: { endpointId: 'deadbeef', displayName: 'Retired Phone' },
		})

		assert.equal(resolvePeerLabel(row, paired), 'Retired Phone')
	})

	it('returns null when the peer was never named', () => {
		const row = record({ peer: { endpointId: 'deadbeef' } })

		assert.equal(resolvePeerLabel(row, paired), null)
	})

	it('returns null for a broadcast share, which had no single peer', () => {
		const row = record({ peer: undefined, peerCount: 3 })

		assert.equal(resolvePeerLabel(row, paired), null)
	})
})

describe('summarizeTransferItems', () => {
	it('names a single file', () => {
		const summary = summarizeTransferItems(
			record({ itemCount: 1, pathType: 'file', rootName: 'report.pdf' })
		)

		assert.deepEqual(summary, { kind: 'named', name: 'report.pdf' })
	})

	it('names a single folder', () => {
		const summary = summarizeTransferItems(
			record({ itemCount: 1, pathType: 'directory', rootName: 'Photos' })
		)

		assert.deepEqual(summary, { kind: 'named', name: 'Photos' })
	})

	it('counts several items rather than naming one of them', () => {
		const summary = summarizeTransferItems(
			record({ itemCount: 4, rootName: '' })
		)

		assert.deepEqual(summary, { kind: 'counted', count: 4 })
	})

	it('reports nothing nameable for a transfer that died before it learned', () => {
		const summary = summarizeTransferItems(
			record({ itemCount: 0, rootName: '' })
		)

		assert.deepEqual(summary, { kind: 'unknown' })
	})
})

describe('formatTransferDuration', () => {
	it('reports sub-second transfers in milliseconds', () => {
		assert.equal(formatTransferDuration(420), '420ms')
	})

	it('reports seconds below a minute', () => {
		assert.equal(formatTransferDuration(2500), '2.5s')
	})

	it('reports minutes and seconds above a minute', () => {
		assert.equal(formatTransferDuration(95_000), '1m 35.0s')
	})

	it('has nothing to report without a measured duration', () => {
		assert.equal(formatTransferDuration(undefined), null)
		assert.equal(formatTransferDuration(0), null)
	})
})

describe('formatTransferSpeed', () => {
	it('reports megabytes per second for fast transfers', () => {
		assert.equal(formatTransferSpeed(5 * 1024 * 1024), '5.00 MB/s')
	})

	it('reports kilobytes per second for slow transfers', () => {
		assert.equal(formatTransferSpeed(2048), '2.00 KB/s')
	})

	it('has nothing to report without a measured speed', () => {
		assert.equal(formatTransferSpeed(undefined), null)
		assert.equal(formatTransferSpeed(0), null)
	})
})
