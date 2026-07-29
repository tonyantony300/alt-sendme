// Desktop stand-in for the web-only WASM engine. vite aliases `wasm-bridge-engine`
// to the real frontend/src/wasm/pkg for web builds and to this stub for desktop,
// so desktop builds don't need the gitignored pkg. Never called on desktop
// (transfers use Tauri IPC); keep signatures in sync with pkg/wasm_bridge.d.ts.

export type WasmSendResult = {
	readonly hash: string
	readonly size: bigint
	readonly ticket: string
}

export type WasmReceiveFileResult = {
	readonly file_names: string[]
	readonly bytesArray: Uint8Array[]
}

function unavailable(): never {
	throw new Error('WASM transfer engine is unavailable in the desktop build')
}

export default function init(_moduleOrPath?: unknown): Promise<unknown> {
	return unavailable()
}

export function set_event_callback(
	_callback: (eventName: string, payload: string | null | undefined) => void
): void {
	unavailable()
}

export function send_file(
	_fileName: string,
	_bytes: Uint8Array,
	_metadataJson?: string | null,
	_relayJson?: string | null
): Promise<WasmSendResult> {
	return unavailable()
}

export function send_items(
	_names: string[],
	_bytesArray: Uint8Array[],
	_entryType: string,
	_metadataJson?: string | null,
	_relayJson?: string | null
): Promise<WasmSendResult> {
	return unavailable()
}

export function stop_sharing(): void {
	unavailable()
}

export function fetch_ticket_metadata(
	_ticket: string,
	_relayJson?: string | null
): Promise<string> {
	return unavailable()
}

export function receive_file(
	_ticket: string,
	_relayJson?: string | null
): Promise<WasmReceiveFileResult> {
	return unavailable()
}

export function verify_relays(_relayJson: string): Promise<string> {
	return unavailable()
}

export function get_relay_status(_relayJson?: string | null): Promise<string> {
	return unavailable()
}
