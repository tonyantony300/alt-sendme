export function relayAuthTokenForIpc(value: string): string | null {
	// Only an actually empty field is omitted. Whitespace-only input must reach
	// Rust IPC validation so an explicitly blank token fails closed.
	return value.length > 0 ? value : null
}
