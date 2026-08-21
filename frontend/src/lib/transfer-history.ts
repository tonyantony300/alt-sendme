/**
 * Reading side of the transfer history the Rust shell records. Rows store raw
 * facts, never localized strings — this module decides what a row says and
 * leaves the wording to the caller's `t()`, so rows re-localize.
 */

export type TransferHistoryDirection = 'send' | 'receive'

export type TransferHistoryStatus =
	| 'inProgress'
	| 'completed'
	| 'failed'
	| 'cancelled'
	| 'interrupted'

export type TransferHistoryPathType = 'file' | 'directory'

/** Statuses a user can pick in the filter row, plus the unfiltered default. */
export type TransferStatusFilter = 'all' | TransferHistoryStatus

export const TRANSFER_STATUS_FILTERS: TransferStatusFilter[] = [
	'all',
	'completed',
	'failed',
	'cancelled',
	'interrupted',
]

export interface TransferHistoryPeer {
	endpointId: string
	displayName?: string
	deviceType?: string
}

export interface TransferRecord {
	id: string
	direction: TransferHistoryDirection
	status: TransferHistoryStatus
	startedAt: number
	endedAt?: number
	/** Engine-measured time on the wire, excluding setup and disk export. */
	durationMs?: number
	/** Receiver only: time spent writing the files out to disk. */
	exportMs?: number
	/** User payload only — protocol metadata is already excluded. */
	payloadBytes: number
	bytesTransferred: number
	avgSpeedBps?: number
	itemCount: number
	pathType?: TransferHistoryPathType
	rootName: string
	fileNames: string[]
	fileNamesTruncated: boolean
	blobHash?: string
	peer?: TransferHistoryPeer
	peerCount: number
	savePath?: string
	conflictCount: number
	resumableStorePath?: string
	error?: string
}

/** Shape of a paired device as `list_paired_devices` returns it. */
interface KnownDevice {
	endpoint_id: string
	display_name: string
}

/**
 * Sent and received transfers share one chronological list — direction is a
 * property of each row, shown by its arrow, not a way to split the history.
 */
export function filterTransferHistory(
	records: TransferRecord[],
	status: TransferStatusFilter
): TransferRecord[] {
	return records.filter(
		(record) => status === 'all' || record.status === status
	)
}

/**
 * The device name to show for a row, or null when none is known. The current
 * paired-device name wins so a rename updates past rows; the transfer-time
 * snapshot covers devices since forgotten.
 */
export function resolvePeerLabel(
	record: TransferRecord,
	pairedDevices: KnownDevice[]
): string | null {
	const peer = record.peer
	if (!peer) {
		return null
	}

	const current = pairedDevices.find(
		(device) =>
			device.endpoint_id.toLowerCase() === peer.endpointId.toLowerCase()
	)

	return current?.display_name ?? peer.displayName ?? null
}

export type TransferItemSummary =
	| { kind: 'named'; name: string }
	| { kind: 'counted'; count: number }
	| { kind: 'unknown' }

/**
 * What a row should call the thing that moved. `counted` and `unknown` go to
 * the caller's `t()` — an interrupted transfer often dies before file names land.
 */
export function summarizeTransferItems(
	record: TransferRecord
): TransferItemSummary {
	if (record.itemCount === 1 && record.rootName) {
		return { kind: 'named', name: record.rootName }
	}
	if (record.itemCount > 1) {
		return { kind: 'counted', count: record.itemCount }
	}
	return record.rootName
		? { kind: 'named', name: record.rootName }
		: { kind: 'unknown' }
}

/**
 * Engine wire time, or null when the transfer never got far enough to measure —
 * null rather than a string so the caller can localize "not recorded".
 */
export function formatTransferDuration(ms: number | undefined): string | null {
	if (!ms || !Number.isFinite(ms) || ms <= 0) {
		return null
	}
	if (ms < 1000) {
		return `${ms}ms`
	}
	if (ms < 60_000) {
		return `${(ms / 1000).toFixed(1)}s`
	}
	const minutes = Math.floor(ms / 60_000)
	const seconds = ((ms % 60_000) / 1000).toFixed(1)
	return `${minutes}m ${seconds}s`
}

/** Average throughput, or null when it was never measured. */
export function formatTransferSpeed(
	bytesPerSecond: number | undefined
): string | null {
	if (
		!bytesPerSecond ||
		!Number.isFinite(bytesPerSecond) ||
		bytesPerSecond <= 0
	) {
		return null
	}
	const mbps = bytesPerSecond / (1024 * 1024)
	if (mbps >= 1) {
		return `${mbps.toFixed(2)} MB/s`
	}
	return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`
}
