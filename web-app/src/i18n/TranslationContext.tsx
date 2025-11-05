import React, { ReactNode, useEffect, useCallback, useState } from "react"
import i18next, { loadTranslations } from "./setup"
import { TranslationContext } from "./context"

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [language, setLanguage] = useState(i18next.language)

	useEffect(() => {
		try {
			loadTranslations()
		} catch (error) {
		}
	}, [])

	useEffect(() => {
		const handleLanguageChange = () => {
			const newLang = localStorage.getItem('altsendme-language') || 'en'
			if (newLang !== language) {
				setLanguage(newLang)
				i18next.changeLanguage(newLang)
			}
		}

		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'altsendme-language') {
				handleLanguageChange()
			}
		}

		window.addEventListener('languagechange', handleLanguageChange)
		window.addEventListener('storage', handleStorageChange)
		
		return () => {
			window.removeEventListener('languagechange', handleLanguageChange)
			window.removeEventListener('storage', handleStorageChange)
		}
	}, [language])

	const translate = useCallback(
		(key: string, options?: Record<string, unknown>) => {
			return i18next.t(key, options)
		},
		[language],
	)

	return (
		<TranslationContext.Provider
			value={{
				t: translate,
				i18n: i18next,
			}}>
			{children}
		</TranslationContext.Provider>
	)
}

export default TranslationProvider

