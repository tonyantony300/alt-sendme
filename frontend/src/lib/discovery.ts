import { useAppSettingStore } from '../store/app-setting'
import {
	buildDiscoveryConfigArg,
	type DiscoveryConfigArg,
} from './discovery-config'

export type { DiscoveryConfigArg, DiscoveryMode } from './discovery-config'

export type VerifyDiscoveryResponse = {
	url: string | null
	latencyMs: number
}

export function getDiscoveryConfigArg(): DiscoveryConfigArg {
	const { discoveryMode, pkarrRelayUrl, dnsOrigin } =
		useAppSettingStore.getState()

	return buildDiscoveryConfigArg({ discoveryMode, pkarrRelayUrl, dnsOrigin })
}
