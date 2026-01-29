import { useThemeStore } from '../store'
import { useEffect } from 'react'
type Props = {
	children: React.ReactNode
}
export function AppThemeProvider({ children }: Props) {
	const theme = useThemeStore((state) => state.activeTheme)

	useEffect(() => {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark')
			document.documentElement.classList.remove('light')
		} else {
			document.documentElement.classList.add('light')
			document.documentElement.classList.remove('dark')
		}
	}, [theme])

	return <>{children}</>
}
