/**
 * Parsing for the engine's transfer telemetry. Sender and receiver share the
 * `<bytes>:<total>:<speed x1000>` payload and the engine measures both the same
 * way, so the UI must not re-derive or re-smooth them.
 */

export type TransferProgressUpdate = {
	bytesTransferred: number
	totalBytes: number
	speedBps: number
	percentage: number
	etaSeconds?: number
}

export type TransferCompletion = {
	/** Time on the wire, excluding connection setup and disk export. */
	durationMs: number
	/** Receiver only: time spent writing the files out to disk. */
	exportMs?: number
	/**
	 * Receiver only: the directory the files were written to. Differs from the
	 * chosen download folder when an auto-accepted transfer used a per-device
	 * subfolder, so "Open" must prefer this over the base path.
	 */
	outputDir?: string
}

export function parseProgressPayload(
	payload: string
): TransferProgressUpdate | null {
	const parts = payload.split(':')
	if (parts.length !== 3) {
		return null
	}

	const bytesTransferred = Number.parseInt(parts[0], 10)
	const totalBytes = Number.parseInt(parts[1], 10)
	const speedInt = Number.parseInt(parts[2], 10)
	if (
		!Number.isFinite(bytesTransferred) ||
		!Number.isFinite(totalBytes) ||
		!Number.isFinite(speedInt)
	) {
		return null
	}

	const speedBps = Math.max(speedInt / 1000, 0)
	const percentage =
		totalBytes > 0 ? Math.min((bytesTransferred / totalBytes) * 100, 100) : 0
	const bytesRemaining = Math.max(totalBytes - bytesTransferred, 0)
	const etaSeconds =
		speedBps > 0 && bytesRemaining > 0 ? bytesRemaining / speedBps : undefined

	return {
		bytesTransferred,
		totalBytes,
		speedBps,
		percentage,
		etaSeconds,
	}
}

export function parseCompletionPayload(
	payload: unknown
): TransferCompletion | null {
	if (typeof payload !== 'string') {
		return null
	}

	try {
		const parsed = JSON.parse(payload) as Record<string, unknown>
		const durationMs = parsed.durationMs
		if (typeof durationMs !== 'number' || !Number.isFinite(durationMs)) {
			return null
		}
		const completion: TransferCompletion = { durationMs }
		const exportMs = parsed.exportMs
		if (typeof exportMs === 'number' && Number.isFinite(exportMs)) {
			completion.exportMs = exportMs
		}
		const outputDir = parsed.outputDir
		if (typeof outputDir === 'string' && outputDir) {
			completion.outputDir = outputDir
		}
		return completion
	} catch {
		return null
	}
}
