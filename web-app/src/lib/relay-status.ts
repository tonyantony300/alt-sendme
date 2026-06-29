import {
	buildRelayConfigArg,
	type RelayConfigArg,
	type RelayConfigInput,
} from './relay-config.js'

export function buildRelayStatusConfig({
	relayMode,
	relayUrls,
	relayAuthToken,
	relayFallback,
}: RelayConfigInput): RelayConfigArg {
	return buildRelayConfigArg({
		relayMode,
		relayUrls,
		relayAuthToken,
		relayFallback,
	})
}
