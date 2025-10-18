import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sender } from './components/sender/Sender'
import { Receiver } from './components/receiver/Receiver'

function App() {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send')

  return (
    <div className="min-h-screen relative glass-background" style={{ color: 'var(--app-bg-fg)' }}>
      {/* Custom drag region - enables window dragging */}
      <div 
        className="absolute w-full h-10 z-10" 
        data-tauri-drag-region 
      />
      
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-3xl font-bold text-center mb-8 select-none" 
            style={{ color: 'var(--app-bg-fg)' }}
          >
            BETTER-SENDME
          </h1>
          
          {/* Tab Navigation */}
          <div 
      
            className="flex space-x-1 mb-6 p-1 rounded-lg relative select-none" 
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            {/* Animated Background Indicator */}
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
              Send Files
            </motion.button>
            <motion.button
              onClick={() => setActiveTab('receive')}
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
              Receive Files
            </motion.button>
          </div>
          
          {/* Tab Content */}
          <div 
            className="rounded-lg shadow-sm glass-card overflow-hidden"
          >
        
              {activeTab === 'send' ? (
                <motion.div
                  key="send"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Sender />
                </motion.div>
              ) : (
                <motion.div
                  key="receive"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                 
                >
                  <Receiver />
                </motion.div>
              )}
          
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
