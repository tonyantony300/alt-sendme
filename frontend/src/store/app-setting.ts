import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { IS_DESKTOP } from '../lib/platform'
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
	/** One-shot: the post-pairing autostart prompt has been shown. */
	autostartPromptSeen: boolean
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
	setAutostartPromptSeen: (value: boolean) => void
}

export type AppSettings = AppSettingsState & AppSettingsActions

const AppSettingsKey = 'app_settings'

/** Bumped whenever a persisted value needs correcting; see `migrateAppSettings`. */
const AppSettingsVersion = 1

/**
 * v0 → v1: force `minimizeToTray` back to `true`.
 *
 * Until the always-on-presence work landed, nothing read this key — the
 * toggle was dead and the window-close handler hid to the tray
 * unconditionally. `persist` has no `partialize`, so the whole state object
 * (including the old hardcoded `minimizeToTray: false` default) was written
 * to disk the first time a user changed *any* setting. A persisted `false`
 * therefore records a dead default, never a user choice.
 *
 * Reading it as intent would flip "close hides to tray" — the behaviour
 * every install has always had — into "close quits", which shuts the node
 * down and kills in-flight transfers on the first upgrade.
 *
 * Only this one key is corrected; every other persisted value is carried
 * through untouched. `version: 1` is written back to disk as part of
 * rehydration, so this runs at most once per install: a user who turns the
 * toggle off *after* upgrading keeps it off.
 */
function migrateAppSettings(
	persistedState: unknown,
	version: number
): Partial<AppSettingsState> {
	// `persistedState` is whatever happened to be on disk — never assume a shape.
	const state =
		typeof persistedState === 'object' &&
		persistedState !== null &&
		!Array.isArray(persistedState)
			? (persistedState as Partial<AppSettingsState>)
			: {}

	if (version < 1) {
		return { ...state, minimizeToTray: true }
	}
	return state
}

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
			setAutostartPromptSeen: (value: boolean) =>
				set({ autostartPromptSeen: value }),
		}),
		{
			name: AppSettingsKey,
			version: AppSettingsVersion,
			migrate: migrateAppSettings,
			storage: createJSONStorage(() => localSettingLazyStoreStorage),
			merge: (persistedState, currentState) => ({
				...currentState,
				...(persistedState as Partial<AppSettings>),
			}),
			// The Rust close handler seeds itself from `settings.json` during
			// `setup()`, long before the webview rehydrates — so on the launch
			// where the migration above corrects a stale value, the running
			// process would still be using the old one. Push the hydrated value
			// across so the correction applies to this session, not just the
			// next one.
			onRehydrateStorage: () => (state) => {
				if (!state || !IS_DESKTOP) return
				void import('../lib/platform-api')
					.then(({ invoke }) =>
						invoke('set_background_on_close', {
							enabled: state.minimizeToTray,
						})
					)
					.catch((error) => {
						console.warn('Failed to sync minimizeToTray to backend:', error)
					})
			},
		}
	)
)
