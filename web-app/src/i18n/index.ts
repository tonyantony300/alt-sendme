// Export the main i18n setup
export { default as i18n, loadTranslations } from './setup'

// Export the React context and hook
export { TranslationProvider } from './TranslationContext'

// Export types
export type { I18nInstance, TranslationResources } from './setup'

// Re-export compatibility functions for existing code
export { useTranslation } from './react-i18next-compat'
export { useAppTranslation } from './hooks'

