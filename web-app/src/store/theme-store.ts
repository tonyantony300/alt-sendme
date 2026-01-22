import { create } from 'zustand'
import {
	persist,
	// createJSONStorage
} from 'zustand/middleware'
import type { AppTheme } from '../types/app'

export type IThemeStore = {
	themes: AppTheme[]
	activeTheme: AppTheme
	setTheme: (theme: AppTheme) => void
	isDark: boolean
	setIsDark: (isDark: boolean) => void
}

export const useThemeStore = create<IThemeStore>()(
	persist(
		(set) => ({
			themes: ['dark', 'light', 'auto'],
			activeTheme: 'auto',
			setTheme: (activeTheme: AppTheme) => set(() => ({ activeTheme })),
			isDark: false,
			setIsDark: (isDark: boolean) => set(() => ({ isDark })),
		}),
		{
			name: 'active-theme',
			// storage: createJSONStorage(() => sessionStorage),
			partialize: (state) =>
				Object.fromEntries(
					Object.entries(state).filter(([key]) => key === 'activeTheme')
				),
		}
	)
)
