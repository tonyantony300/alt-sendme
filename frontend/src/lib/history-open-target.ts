import type { TransferRecord } from './transfer-history.js'

/**
 * How a history row's "Open" reaches its files on Android, where a path is only
 * a label. `folder` carries the SAF tree the transfer exported into; `downloads`
 * names a MediaStore location a folder intent can resolve.
 */
export type HistoryOpenTarget =
	| { kind: 'folder'; treeUri: string }
	| { kind: 'downloads'; relativePath: string }
	| null

/**
 * Rows recorded before the tree URI was stored have only their path, so they
 * fall back to the folder intent — the right answer for a MediaStore receive
 * and a near miss for a SAF one, which is better than refusing to open.
 */
export function resolveAndroidOpenTarget(
	record: Pick<TransferRecord, 'saveUri' | 'savePath'>
): HistoryOpenTarget {
	const treeUri = record.saveUri?.trim()
	if (treeUri) return { kind: 'folder', treeUri }

	const relativePath = record.savePath?.trim().replace(/^\/+|\/+$/g, '')
	if (relativePath) return { kind: 'downloads', relativePath }

	return null
}

/** A row with nowhere to point should not offer the button at all. */
export function canOpenTransfer(
	record: Pick<TransferRecord, 'saveUri' | 'savePath'>
): boolean {
	return Boolean(record.saveUri?.trim() || record.savePath?.trim())
}
