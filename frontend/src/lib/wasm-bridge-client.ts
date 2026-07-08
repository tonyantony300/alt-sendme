import { dispatchWebEvent } from './web-event-bus'
import type { RelayConfigArg } from './relay-config'

type WasmBridgeModule = typeof import('wasm-bridge-engine')

export type VerifyRelaysResponse = {
	url: string | null
	latencyMs: number
}

export type RelayStatusResponse = {
	kind: 'public' | 'custom' | 'disabled' | 'unavailable'
	url: string | null
	connected: boolean
	fellBackToPublic: boolean
}

let initPromise: Promise<WasmBridgeModule> | null = null
let currentTicket: string | null = null

function relayJson(relay?: RelayConfigArg | null): string | undefined {
	if (!relay) return undefined
	return JSON.stringify(relay)
}

async function loadWasmBridge(): Promise<WasmBridgeModule> {
	const wasm = await import('wasm-bridge-engine')
	await wasm.default()

	wasm.set_event_callback(
		(eventName: string, payload: string | null | undefined) => {
			dispatchWebEvent(eventName, payload ?? undefined)
		}
	)

	return wasm
}

export async function ensureWasmBridge(): Promise<WasmBridgeModule> {
	if (!initPromise) {
		initPromise = loadWasmBridge().catch((error) => {
			initPromise = null
			throw error
		})
	}
	return initPromise
}

export function getWebSharingTicket(): string | null {
	return currentTicket
}

export async function wasmSendFile(
	fileName: string,
	bytes: Uint8Array,
	metadataJson?: string,
	relay?: RelayConfigArg
): Promise<string> {
	const wasm = await ensureWasmBridge()
	const result = await wasm.send_file(
		fileName,
		bytes,
		metadataJson ?? undefined,
		relayJson(relay)
	)
	currentTicket = result.ticket
	return result.ticket
}

export async function wasmSendItems(
	names: string[],
	bytesList: Uint8Array[],
	entryType: 'file' | 'directory' | 'collection',
	metadataJson: string,
	relay?: RelayConfigArg
): Promise<string> {
	const wasm = await ensureWasmBridge()
	const result = await wasm.send_items(
		names,
		bytesList,
		entryType,
		metadataJson,
		relayJson(relay)
	)
	currentTicket = result.ticket
	return result.ticket
}

export async function wasmStopSharing(): Promise<void> {
	const wasm = await ensureWasmBridge()
	wasm.stop_sharing()
	currentTicket = null
}

export async function wasmFetchTicketMetadata(
	ticket: string,
	relay?: RelayConfigArg
): Promise<string> {
	const wasm = await ensureWasmBridge()
	return wasm.fetch_ticket_metadata(ticket, relayJson(relay))
}

export async function wasmReceiveFile(
	ticket: string,
	relay?: RelayConfigArg
): Promise<{ fileNames: string[]; bytesList: Uint8Array[] }> {
	const wasm = await ensureWasmBridge()
	const result = await wasm.receive_file(ticket, relayJson(relay))
	const fileNames = result.file_names
	const bytesList: Uint8Array[] = []

	for (let index = 0; index < result.bytesArray.length; index++) {
		bytesList.push(new Uint8Array(result.bytesArray[index]))
	}

	return { fileNames, bytesList }
}

export async function wasmVerifyRelays(
	relay: RelayConfigArg
): Promise<VerifyRelaysResponse> {
	const wasm = await ensureWasmBridge()
	const json = await wasm.verify_relays(JSON.stringify(relay))
	return JSON.parse(json) as VerifyRelaysResponse
}

export async function wasmGetRelayStatus(
	relay?: RelayConfigArg
): Promise<RelayStatusResponse> {
	const wasm = await ensureWasmBridge()
	const json = await wasm.get_relay_status(relayJson(relay))
	return JSON.parse(json) as RelayStatusResponse
}

export function triggerBrowserDownload(
	bytes: Uint8Array,
	fileName: string
): void {
	const copy = new Uint8Array(bytes)
	const blob = new Blob([copy])
	const url = URL.createObjectURL(blob)
	const anchor = document.createElement('a')
	anchor.href = url
	anchor.download = fileName
	anchor.style.display = 'none'
	document.body.appendChild(anchor)
	anchor.click()
	anchor.remove()
	URL.revokeObjectURL(url)
}
