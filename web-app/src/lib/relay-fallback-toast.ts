type RelayFallbackStage = 'send' | 'receive'

const DESCRIPTION_KEYS: Record<RelayFallbackStage, string> = {
	send: 'footer.relay.fellBackToastSend',
	receive: 'footer.relay.fellBackToastReceive',
}

export function relayFallbackToastDescriptionKey(
	payload: string
): string | null {
	if (payload === 'send' || payload === 'receive') {
		return DESCRIPTION_KEYS[payload]
	}

	return null
}
