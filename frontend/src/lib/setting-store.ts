import type { StateStorage } from 'zustand/middleware'
import type { AppSettingsState } from '../store/app-setting'
import { IS_WEB } from './platform'

export const SETTING_FILE = 'settings.json'

export const defaultAppSettings: AppSettingsState = {
	minimizeToTray: true,
	startOnBoot: false,
	enableNotifications: true,
	darkMode: false,
	autoUpdate: true,
	showProgressOnIcon: false,
	downloadsPath: '',
	downloadsUri: '',
	windowsContextMenu: true,
	relayMode: 'default',
	relayUrls: [''],
	relayAuthToken: '',
	relayFallback: 'strict',
	discoveryMode: 'default',
	pkarrRelayUrl: '',
	dnsOrigin: '',
	showBroadcastToggle: false,
	discoverability: 'everyone',
	autostartPromptSeen: false,
}

const webSettingStorage: StateStorage = {
	getItem: async (name: string) => localStorage.getItem(name),
	setItem: async (name: string, value: string) => {
		localStorage.setItem(name, value)
	},
	removeItem: async (name: string) => {
		localStorage.removeItem(name)
	},
}

let tauriSettingStorage: StateStorage | null = null

async function getTauriSettingStorage(): Promise<StateStorage> {
	if (!tauriSettingStorage) {
		const { createTauriSettingStorage } = await import('./setting-store-tauri')
		tauriSettingStorage = createTauriSettingStorage()
	}
	return tauriSettingStorage
}

export const localSettingLazyStoreStorage: StateStorage = IS_WEB
	? webSettingStorage
	: {
			getItem: async (name: string) =>
				(await getTauriSettingStorage()).getItem(name),
			setItem: async (name: string, value: string) =>
				(await getTauriSettingStorage()).setItem(name, value),
			removeItem: async (name: string) =>
				(await getTauriSettingStorage()).removeItem(name),
		}
