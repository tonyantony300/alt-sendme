import { useAppTranslation } from './hooks'

export const useTranslation = (namespace?: string) => {
  const { t, i18n: i18nInstance } = useAppTranslation()
  
  const namespacedT = namespace
    ? (key: string, options?: Record<string, unknown>) => {
        const finalKey = key.includes(':') ? key : `${namespace}:${key}`
        return t(finalKey, options)
      }
    : t
  
  return {
    t: namespacedT,
    i18n: i18nInstance,
  }
}

export { default as i18n } from './setup'

export { TranslationProvider } from './TranslationContext'
export { useAppTranslation } from './hooks'

