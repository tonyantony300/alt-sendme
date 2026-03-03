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
}

export type AppSettingsActions = {
	setMinimizeToTray: (value: boolean) => void
	setStartOnBoot: (value: boolean) => void
	setEnableNotifications: (value: boolean) => void
	setDarkMode: (value: boolean) => void
	setAutoUpdate: (value: boolean) => void
	toggleShowProgressOnIcon?: (value: boolean) => void
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
		}),
		{
			name: AppSettingsKey,
			storage: createJSONStorage(() => localSettingLazyStoreStorage),
		}
	)
)
