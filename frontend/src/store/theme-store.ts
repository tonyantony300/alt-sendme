import { create } from 'zustand'
import {
	persist,
	// createJSONStorage
} from 'zustand/middleware'
import { APP_THEMES, type AppTheme } from '../types/app'
import { IS_WEB } from '../lib/platform'

export type IThemeStore = {
	themes: AppTheme[]
	activeTheme: AppTheme
	setTheme: (theme: AppTheme) => void
	isDark: boolean
	setIsDark: (isDark: boolean) => void
}

type PersistedThemeState = {
	activeTheme?: AppTheme
}

export const useThemeStore = create<IThemeStore>()(
	persist(
		(set) => ({
			themes: APP_THEMES,
			activeTheme: IS_WEB ? 'light' : 'auto',
			setTheme: (activeTheme: AppTheme) => set(() => ({ activeTheme })),
			isDark: false,
			setIsDark: (isDark: boolean) => set(() => ({ isDark })),
		}),
		{
			name: 'active-theme',
			version: 3,
			// storage: createJSONStorage(() => sessionStorage),
			partialize: (state) =>
				Object.fromEntries(
					Object.entries(state).filter(([key]) => key === 'activeTheme')
				),
			migrate: (persistedState) => {
				const state = (persistedState ?? {}) as PersistedThemeState
				const removed = new Set(['ocean', 'forest', 'high-contrast'])
				if (
					state.activeTheme &&
					removed.has(state.activeTheme as string)
				) {
					return { activeTheme: 'light' as const }
				}
				if (IS_WEB && state.activeTheme === 'auto') {
					return { activeTheme: 'light' as const }
				}
				if (
					state.activeTheme &&
					!(APP_THEMES as readonly string[]).includes(state.activeTheme)
				) {
					return {
						activeTheme: (IS_WEB ? 'light' : 'auto') as AppTheme,
					}
				}
				return state
			},
		}
	)
)
