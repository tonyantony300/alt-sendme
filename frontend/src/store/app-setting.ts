import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
	defaultAppSettings,
	localSettingLazyStoreStorage,
} from '../lib/setting-store'

export type AppSettingsState = {
	minimizeToTray: boolean
	startOnBoot: boolean
	enableNotifications: boolean
	darkMode: boolean
	autoUpdate: boolean
	showProgressOnIcon: boolean
	downloadsPath: string
	downloadsUri: string
	windowsContextMenu: boolean
	relayMode: 'default' | 'custom' | 'disabled'
	relayUrls: string[]
	relayAuthToken: string
	relayFallback: 'strict' | 'public'
	discoveryMode: 'default' | 'custom'
	pkarrRelayUrl: string
	dnsOrigin: string
	showBroadcastToggle: boolean
	/**
	 * Nearby/LAN discoverability. Mirrors the engine's `Discoverability` —
	 * persisted here (like the relay settings) so it survives restarts;
	 * `init_node_service` reads this store's file before the node starts so an
	 * `Off` choice never registers mDNS even briefly, and `DeviceNodeSync`
	 * re-applies it once the node is ready as a safety net.
	 */
	discoverability: 'everyone' | 'paired-only' | 'off'
}

export type AppSettingsActions = {
	setMinimizeToTray: (value: boolean) => void
	setStartOnBoot: (value: boolean) => void
	setEnableNotifications: (value: boolean) => void
	setDarkMode: (value: boolean) => void
	setAutoUpdate: (value: boolean) => void
	toggleShowProgressOnIcon?: (value: boolean) => void
	setDownloadsPath: (value: string) => void
	setDownloadsUri: (value: string) => void
	setWindowsContextMenu: (value: boolean) => void
	setRelayMode: (value: 'default' | 'custom' | 'disabled') => void
	setRelayUrls: (value: string[]) => void
	setRelayAuthToken: (value: string) => void
	setRelayFallback: (value: 'strict' | 'public') => void
	setDiscoveryMode: (value: 'default' | 'custom') => void
	setPkarrRelayUrl: (value: string) => void
	setDnsOrigin: (value: string) => void
	setShowBroadcastToggle: (value: boolean) => void
	setDiscoverability: (value: 'everyone' | 'paired-only' | 'off') => void
}

export type AppSettings = AppSettingsState & AppSettingsActions

const AppSettingsKey = 'app_settings'

export const useAppSettingStore = create<AppSettings>()(
	persist(
		(set) => ({
			...defaultAppSettings,
			setMinimizeToTray: (value: boolean) => set({ minimizeToTray: value }),
			setStartOnBoot: (value: boolean) => set({ startOnBoot: value }),
			setEnableNotifications: (value: boolean) =>
				set({ enableNotifications: value }),
			setDarkMode: (value: boolean) => set({ darkMode: value }),
			setAutoUpdate: (value: boolean) => set({ autoUpdate: value }),
			toggleShowProgressOnIcon: (value: boolean) =>
				set({ showProgressOnIcon: value }),
			setDownloadsPath: (value: string) => set({ downloadsPath: value }),
			setDownloadsUri: (value: string) => set({ downloadsUri: value }),
			setWindowsContextMenu: (value: boolean) =>
				set({ windowsContextMenu: value }),
			setRelayMode: (value: 'default' | 'custom' | 'disabled') =>
				set({ relayMode: value }),
			setRelayUrls: (value: string[]) => set({ relayUrls: value }),
			setRelayAuthToken: (value: string) => set({ relayAuthToken: value }),
			setRelayFallback: (value: 'strict' | 'public') =>
				set({ relayFallback: value }),
			setDiscoveryMode: (value: 'default' | 'custom') =>
				set({ discoveryMode: value }),
			setPkarrRelayUrl: (value: string) => set({ pkarrRelayUrl: value }),
			setDnsOrigin: (value: string) => set({ dnsOrigin: value }),
			setShowBroadcastToggle: (value: boolean) =>
				set({ showBroadcastToggle: value }),
			setDiscoverability: (value: 'everyone' | 'paired-only' | 'off') =>
				set({ discoverability: value }),
		}),
		{
			name: AppSettingsKey,
			storage: createJSONStorage(() => localSettingLazyStoreStorage),
			merge: (persistedState, currentState) => ({
				...currentState,
				...(persistedState as Partial<AppSettings>),
			}),
		}
	)
)
