import { useState, useRef, useEffect } from 'react'
import { useAppTranslation } from '../i18n/hooks'
import { ChevronDown } from 'lucide-react'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'fr', label: 'Français' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'th', label: 'Thai' },
  { value: 'it', label: 'Italiano' },
  { value: 'cs', label: 'Čeština' },
]

export function LanguageSwitcher() {
  const { i18n } = useAppTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage = LANGUAGES.find(lang => lang.value === i18n.language) || LANGUAGES[0]

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setIsOpen(false)
    window.dispatchEvent(new Event('languagechange'))
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-xs transition-colors hover:opacity-80"
        style={{
          color: 'var(--app-main-view-fg)',
          textDecoration: 'underline',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {currentLanguage.label}
        <ChevronDown 
          size={12} 
          className="transition-transform"
          style={{ 
            transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 bottom-full mb-1 rounded-md shadow-lg overflow-hidden z-50"
          style={{
            backgroundColor: 'var(--app-main-view)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            minWidth: '120px',
          }}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              onClick={() => changeLanguage(lang.value)}
              className="w-full text-left px-3 py-2 text-xs transition-colors"
              style={{
                color: 'var(--app-main-view-fg)',
                backgroundColor: i18n.language === lang.value 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 
                  i18n.language === lang.value 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'transparent'
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

