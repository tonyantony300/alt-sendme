import React, { ReactNode, useEffect, useCallback, useState } from "react"
import i18next, { loadTranslations } from "./setup"
import { TranslationContext } from "./context"

// Translation provider component
export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [language, setLanguage] = useState(i18next.language)

	// Load translations once when the component mounts
	useEffect(() => {
		try {
			loadTranslations()
		} catch (error) {
			console.error("Failed to load translations:", error)
		}
	}, [])

	// Listen for language changes from both localStorage and custom events
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

		// Listen for custom languagechange event
		window.addEventListener('languagechange', handleLanguageChange)
		// Listen for storage changes (for cross-tab sync)
		window.addEventListener('storage', handleStorageChange)
		
		return () => {
			window.removeEventListener('languagechange', handleLanguageChange)
			window.removeEventListener('storage', handleStorageChange)
		}
	}, [language])

	// Memoize the translation function to prevent unnecessary re-renders
	const translate = useCallback(
		(key: string, options?: Record<string, unknown>) => {
			return i18next.t(key, options)
		},
		[language], // Re-create when language changes
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

