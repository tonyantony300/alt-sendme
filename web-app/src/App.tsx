import { useState } from 'react'
import { Sender } from './components/Sender'
import { Receiver } from './components/Receiver'

function App() {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send')

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--app-bg)', color: 'var(--app-bg-fg)' }}>
      {/* Custom drag region - enables window dragging */}
      <div 
        className="absolute w-full h-10 z-10" 
        data-tauri-drag-region 
      />
      
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8" style={{ color: 'var(--app-bg-fg)' }}>
            BETTER-SENDME
          </h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 p-1 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <button
              onClick={() => setActiveTab('send')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'send'
                  ? 'shadow-sm'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeTab === 'send' ? 'var(--app-main-view)' : 'transparent',
                color: 'var(--app-main-view-fg)',
                border: activeTab === 'send' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
              }}
            >
              Send Files
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'receive'
                  ? 'shadow-sm'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeTab === 'receive' ? 'var(--app-main-view)' : 'transparent',
                color: 'var(--app-main-view-fg)',
                border: activeTab === 'receive' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
              }}
            >
              Receive Files
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="rounded-lg shadow-sm border" style={{ 
            backgroundColor: 'var(--app-main-view)', 
            borderColor: 'rgba(255, 255, 255, 0.1)' 
          }}>
            {activeTab === 'send' ? <Sender /> : <Receiver />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
