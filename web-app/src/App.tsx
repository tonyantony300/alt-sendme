import { useState } from 'react'
import { Sender } from './components/Sender'
import { Receiver } from './components/Receiver'

function App() {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Sendme Desktop
          </h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('send')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'send'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Send Files
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'receive'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Receive Files
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {activeTab === 'send' ? <Sender /> : <Receiver />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
