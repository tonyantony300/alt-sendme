import { relayAuthTokenForIpc } from './relay-auth-token.js'

type RelayMode = 'default' | 'custom' | 'disabled'
type RelayFallback = 'strict' | 'public'

type RelayConfigArg = {
	mode: RelayMode
	urls: string[]
	auth_token?: string | null
	fallback: RelayFallback
}

type RelayStatusConfigInput = {
	relayMode: RelayMode
	relayUrls: string[]
	relayAuthToken: string
	relayFallback: RelayFallback
}

export function buildRelayStatusConfig({
	relayMode,
	relayUrls,
	relayAuthToken,
	relayFallback,
}: RelayStatusConfigInput): RelayConfigArg {
	return {
		mode: relayMode,
		urls: relayUrls.map((url) => url.trim()).filter(Boolean),
		auth_token:
			relayMode === 'custom' ? relayAuthTokenForIpc(relayAuthToken) : null,
		fallback: relayFallback,
	}
}
