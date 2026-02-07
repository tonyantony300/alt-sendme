import { useThemeStore } from '../store'
import { useEffect } from 'react'
type Props = {
	children: React.ReactNode
}

function resolveTheme(theme: string): 'dark' | 'light' {
	if (theme === 'auto') {
		return window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light'
	}
	return theme as 'dark' | 'light'
}

export function AppThemeProvider({ children }: Props) {
	const theme = useThemeStore((state) => state.activeTheme)
	const setIsDark = useThemeStore((state) => state.setIsDark)

	useEffect(() => {
		const apply = (resolved: 'dark' | 'light') => {
			document.documentElement.classList.toggle('dark', resolved === 'dark')
			document.documentElement.classList.toggle('light', resolved === 'light')
			setIsDark(resolved === 'dark')
		}

		apply(resolveTheme(theme))

		if (theme === 'auto') {
			const mq = window.matchMedia('(prefers-color-scheme: dark)')
			const handler = (e: MediaQueryListEvent) => {
				apply(e.matches ? 'dark' : 'light')
			}
			mq.addEventListener('change', handler)
			return () => mq.removeEventListener('change', handler)
		}
	}, [theme, setIsDark])

	return <>{children}</>
}
