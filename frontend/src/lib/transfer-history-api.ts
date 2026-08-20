/**
 * Tauri surface for the transfer history the Rust shell records.
 *
 * Every call is stubbed on web (see `platform-api.ts`), so callers do not need
 * to branch on platform — the page itself is simply not reachable there.
 */
import { invoke } from './platform-api'
import type { TransferRecord } from './transfer-history'

export interface TransferTempData {
	exists: boolean
	sizeBytes: number
}

export function listTransferHistory(): Promise<TransferRecord[]> {
	return invoke<TransferRecord[]>('list_transfer_history')
}

/** Removes the row and the partial store it was the only pointer to. */
export function deleteTransferRecord(id: string): Promise<void> {
	return invoke<void>('delete_transfer_record', { id })
}

export function clearTransferHistory(): Promise<void> {
	return invoke<void>('clear_transfer_history')
}

/** Stat'd live — the directory can vanish between renders. */
export function getTransferTempData(id: string): Promise<TransferTempData> {
	return invoke<TransferTempData>('get_transfer_temp_data', { id })
}

/** Frees the partial store while keeping the history row. */
export function clearTransferTempData(id: string): Promise<void> {
	return invoke<void>('clear_transfer_temp_data', { id })
}
