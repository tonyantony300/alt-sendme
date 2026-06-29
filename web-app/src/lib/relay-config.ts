import { relayAuthTokenForIpc } from './relay-auth-token.js'

export type RelayMode = 'default' | 'custom' | 'disabled'
export type RelayFallback = 'strict' | 'public'

export type RelayConfigArg = {
	mode: RelayMode
	urls: string[]
	auth_token?: string | null
	fallback: RelayFallback
}

export type RelayConfigInput = {
	relayMode: RelayMode
	relayUrls: string[]
	relayAuthToken: string
	relayFallback: RelayFallback
}

export function buildRelayConfigArg({
	relayMode,
	relayUrls,
	relayAuthToken,
	relayFallback,
}: RelayConfigInput): RelayConfigArg {
	return {
		mode: relayMode,
		urls:
			relayMode === 'custom'
				? relayUrls.map((url) => url.trim()).filter(Boolean)
				: [],
		auth_token:
			relayMode === 'custom' ? relayAuthTokenForIpc(relayAuthToken) : null,
		fallback: relayFallback,
	}
}
