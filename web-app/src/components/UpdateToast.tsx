import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '../i18n/react-i18next-compat'

interface UpdateToastProps {
  version: string
  onUpdate: () => void
  onDismiss: () => void
}

export function UpdateToast({ version, onUpdate, onDismiss }: UpdateToastProps) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-2 left-4 z-50 rounded-lg shadow-lg"
        style={{
          backgroundColor: 'var(--app-main-view)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          minWidth: '280px',
          maxWidth: '400px',
        }}
      >
        <div className="p-2 pl-4 flex gap-2 items-center">
          <div className="text-xs font-medium" style={{ color: 'var(--app-main-view-fg)' }}>
            {t('common:updateAvailable', { version })}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                color: 'var(--app-update-toast-text)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {t('common:updateLater')}
            </button>
            <button
              onClick={onUpdate}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                color: 'var(--app-main-view-fg)',
                backgroundColor: 'var(--app-primary)',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              {t('common:updateNow')}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

