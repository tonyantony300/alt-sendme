import { useAppSettingStore } from '../store/app-setting'

export type RelayMode = 'default' | 'custom' | 'disabled'

export type RelayConfigArg = {
	mode: RelayMode
	urls: string[]
	auth_token?: string | null
}

export function getRelayConfigArg(): RelayConfigArg {
	const { relayMode, relayUrls, relayAuthToken } = useAppSettingStore.getState()

	return {
		mode: relayMode,
		urls: relayUrls.map((url) => url.trim()).filter(Boolean),
		auth_token: relayAuthToken.trim() || null,
	}
}
