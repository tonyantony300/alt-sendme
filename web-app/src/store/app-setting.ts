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
	windowsContextMenu: boolean
	relayMode: 'default' | 'custom' | 'disabled'
	relayUrls: string[]
	relayAuthToken: string
	relayFallback: 'strict' | 'public'
	showBroadcastToggle: boolean
}

export type AppSettingsActions = {
	setMinimizeToTray: (value: boolean) => void
	setStartOnBoot: (value: boolean) => void
	setEnableNotifications: (value: boolean) => void
	setDarkMode: (value: boolean) => void
	setAutoUpdate: (value: boolean) => void
	toggleShowProgressOnIcon?: (value: boolean) => void
	setDownloadsPath: (value: string) => void
	setWindowsContextMenu: (value: boolean) => void
	setRelayMode: (value: 'default' | 'custom' | 'disabled') => void
	setRelayUrls: (value: string[]) => void
	setRelayAuthToken: (value: string) => void
	setRelayFallback: (value: 'strict' | 'public') => void
	setShowBroadcastToggle: (value: boolean) => void
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
			setWindowsContextMenu: (value: boolean) =>
				set({ windowsContextMenu: value }),
			setRelayMode: (value: 'default' | 'custom' | 'disabled') =>
				set({ relayMode: value }),
			setRelayUrls: (value: string[]) => set({ relayUrls: value }),
			setRelayAuthToken: (value: string) => set({ relayAuthToken: value }),
			setRelayFallback: (value: 'strict' | 'public') =>
				set({ relayFallback: value }),
			setShowBroadcastToggle: (value: boolean) =>
				set({ showBroadcastToggle: value }),
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
