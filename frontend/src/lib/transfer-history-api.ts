/**
 * Tauri surface for the transfer history the Rust shell records. Stubbed on web
 * (see `platform-api.ts`), so callers need no platform branch.
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
