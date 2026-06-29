export function relayAuthTokenForIpc(value: string): string | null {
	return value.length > 0 ? value : null
}
