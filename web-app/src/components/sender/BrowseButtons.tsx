import type { BrowseButtonsProps } from '../../types/sender'
import { useTranslation } from '../../i18n/react-i18next-compat'

export function BrowseButtons({ 
  isLoading, 
  onBrowseFile, 
  onBrowseFolder 
}: BrowseButtonsProps) {
  const { t } = useTranslation()
  
  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onBrowseFile()
        }}
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--app-accent)',
          color: 'var(--app-accent-fg)',
          border: '1px solid var(--app-accent)',
        }}
      >
        {isLoading ? t('common:loading') : t('common:sender.browseFile')}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onBrowseFolder()
        }}
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--app-accent)',
          color: 'var(--app-accent-fg)',
          border: '1px solid var(--app-accent)',
        }}
      >
        {isLoading ? t('common:loading') : t('common:sender.browseFolder')}
      </button>
    </div>
  )
}
