import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sender } from './components/sender/Sender'
import { Receiver } from './components/receiver/Receiver'
import { TitleBar } from './components/TitleBar'
import { VERSION_DISPLAY } from './lib/version'
import { TranslationProvider } from './i18n'
import { useTranslation } from './i18n/react-i18next-compat'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { openUrl } from '@tauri-apps/plugin-opener'

function AppContent() {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send')
  const [isSharing, setIsSharing] = useState(false)
  const [isReceiving, setIsReceiving] = useState(false)
  const isInitialRender = useRef(false)
  const { t } = useTranslation()

  useEffect(() => {
      isInitialRender.current = true
  }, [])

  return (
    <div className="h-screen flex flex-col relative glass-background select-none" style={{ color: 'var(--app-bg-fg)' }}>
      {IS_LINUX && <TitleBar title={t('common:appTitle')} />}
      
      {IS_MACOS && (
        <div 
          className="absolute w-full h-10 z-10" 
          data-tauri-drag-region 
        />
      )}
      
      <div className="container mx-auto p-8 flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-3xl font-bold font-mono text-center mb-8 select-none [@media(min-height:680px)]:block hidden" 
            style={{ color: 'var(--app-bg-fg)' }}
          >
            {t('common:appTitle')}
          </h1>
          
          <div 
      
            className="flex space-x-1 mb-6 p-1 rounded-lg relative select-none" 
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <motion.div
              layoutId="activeTab"
              className="absolute h-[calc(100%-8px)] rounded-md"
              style={{
                backgroundColor: 'var(--app-main-view)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              }}
              initial={false}
              animate={{
                left: activeTab === 'send' ? '4px' : 'calc(50% + 2px)',
                width: 'calc(50% - 6px)',
              }}
           
            />
            
            <motion.button
              onClick={() => setActiveTab('send')}
              disabled={isReceiving}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium relative z-10 ${
                activeTab === 'send'
                  ? ''
                  : 'opacity-70'
              }`}
              style={{
                color: 'var(--app-main-view-fg)',
              }}
             
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {t('common:send')}
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('receive')}
              disabled={isSharing}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium relative z-10 ${
                activeTab === 'receive'
                  ? ''
                  : 'opacity-70'
              }`}
              style={{
                color: 'var(--app-main-view-fg)',
              }}
             
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {t('common:receive')}
            </motion.button>
          </div>
          
          <div 
            className="rounded-lg shadow-sm glass-card overflow-hidden"
          >
        
              {activeTab === 'send' ? (
                <motion.div
                  key="send"
                  initial={isInitialRender.current ? { opacity: 0, x: -20 } : false }
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Sender onTransferStateChange={setIsSharing} />
                </motion.div>
              ) : (
                <motion.div
                  key="receive"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                 
                >
                  <Receiver onTransferStateChange={setIsReceiving} />
                </motion.div>
              )}
          
          </div>
        </div>
      </div>
      <div className="w-full h-10 text-center text-xs flex items-center justify-center relative">
        <span>{VERSION_DISPLAY}</span>
        <button
          onClick={async () => {
            try {
              await openUrl('https://buymeacoffee.com/tny_antny')
            } catch (error) {
              console.error('Failed to open URL:', error)
            }
          }}
          className="absolute left-6 bottom-2 px-2 py-1 text-xs transition-colors hover:opacity-80"
          style={{
            color: 'var(--app-main-view-fg)',
            textDecoration: 'underline',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {t('common:donate')}
        </button>
        <div className="absolute right-4 bottom-2">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <TranslationProvider>
      <AppContent />
    </TranslationProvider>
  )
}

export default App
