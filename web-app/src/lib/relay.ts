import { useAppSettingStore } from '../store/app-setting'
import {
	buildRelayConfigArg,
	type RelayConfigArg,
} from './relay-config'

export type { RelayConfigArg, RelayFallback, RelayMode } from './relay-config'

export type VerifyRelaysResponse = {
	url: string | null
	latencyMs: number
}

// Maps AWS/iroh-style relay region codes to ISO 3166-1 alpha-2 country codes
// so we can show a location flag next to a relay URL. The n0 public relays use
// codes like `use1` (US East), `euc1` (EU Central / Frankfurt) and
// `aps1` (Asia Pacific South / Mumbai). Self-hosters are encouraged to follow
// the same convention (e.g. `https://euc1-1.relay.example.com`).
const RELAY_REGION_COUNTRY: Record<string, string> = {
	use1: 'US',
	use2: 'US',
	usw1: 'US',
	usw2: 'US',
	cac1: 'CA',
	sae1: 'BR',
	euw1: 'IE',
	euw2: 'GB',
	euw3: 'FR',
	euc1: 'DE',
	euc2: 'DE',
	eun1: 'SE',
	eus1: 'IT',
	eus2: 'ES',
	aps1: 'IN',
	aps2: 'IN',
	apse1: 'SG',
	apse2: 'AU',
	apse3: 'ID',
	apne1: 'JP',
	apne2: 'KR',
	apne3: 'JP',
	afs1: 'ZA',
	mes1: 'BH',
	mec1: 'AE',
}

export type RelayRegion = {
	regionCode: string
	countryCode: string
}

/**
 * Best-effort parse of a relay region from its URL. Returns null when the URL
 * is invalid or its hostname does not start with a known region code, so flags
 * are always optional and never break unconventional self-hosted URLs.
 */
export function getRelayRegion(url: string): RelayRegion | null {
	let hostname: string
	try {
		hostname = new URL(url.trim()).hostname
	} catch {
		return null
	}

	const token = hostname.split('.')[0]?.split('-')[0]?.toLowerCase()
	if (!token) return null

	const countryCode = RELAY_REGION_COUNTRY[token]
	if (!countryCode) return null

	return { regionCode: token, countryCode }
}

export function getRelayConfigArg(): RelayConfigArg {
	const { relayMode, relayUrls, relayAuthToken, relayFallback } =
		useAppSettingStore.getState()

	return buildRelayConfigArg({
		relayMode,
		relayUrls,
		relayAuthToken,
		relayFallback,
	})
}
