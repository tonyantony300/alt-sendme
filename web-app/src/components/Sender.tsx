import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { DragDrop } from './DragDrop'
import { Copy, X, Upload } from 'lucide-react'

export function Sender() {
  const [isSharing, setIsSharing] = useState(false)
  const [ticket, setTicket] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileSelect = async (path: string) => {
    setSelectedPath(path)
  }

  const openFileDialog = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
      })
      
      if (selected) {
        handleFileSelect(selected)
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error)
      alert('Failed to open file dialog: ' + error)
    }
  }

  const startSharing = async () => {
    if (!selectedPath) return
    
    try {
      setIsLoading(true)
      const result = await invoke<string>('start_sharing', { path: selectedPath })
      setTicket(result)
      setIsSharing(true)
    } catch (error) {
      console.error('Failed to start sharing:', error)
      alert('Failed to start sharing: ' + error)
    } finally {
      setIsLoading(false)
    }
  }

  const stopSharing = async () => {
    try {
      await invoke('stop_sharing')
      setIsSharing(false)
      setTicket(null)
      setSelectedPath(null)
    } catch (error) {
      console.error('Failed to stop sharing:', error)
      alert('Failed to stop sharing: ' + error)
    }
  }

  const copyTicket = async () => {
    if (ticket) {
      try {
        await navigator.clipboard.writeText(ticket)
        alert('Ticket copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy ticket:', error)
        alert('Failed to copy ticket: ' + error)
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Send Files</h2>
        <p className="text-sm text-gray-600">
          Share files and folders with others using P2P technology
        </p>
      </div>

      {!isSharing ? (
        <div className="space-y-4">
          <DragDrop onFileSelect={handleFileSelect} />
          
          <div className="text-center">
            <button
              onClick={openFileDialog}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select File or Folder
            </button>
          </div>

          {selectedPath && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-3">
                <strong>Selected:</strong> {selectedPath}
              </p>
              <button
                onClick={startSharing}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Starting Share...' : 'Start Sharing'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
              <p className="text-sm font-medium text-green-800">
                Sharing Active
              </p>
            </div>
            <p className="text-xs text-green-600 mb-2">
              <strong>File:</strong> {selectedPath}
            </p>
            <p className="text-xs text-green-600">
              Keep this app open while others download your files
            </p>
          </div>
          
          {ticket && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Share this ticket:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ticket}
                  readOnly
                  className="flex-1 p-3 border border-gray-300 rounded-md text-xs font-mono bg-gray-50"
                />
                <button
                  onClick={copyTicket}
                  className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Send this ticket to the person who wants to receive your file
              </p>
            </div>
          )}
          
          <button
            onClick={stopSharing}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center"
          >
            <X className="h-4 w-4 mr-2" />
            Stop Sharing
          </button>
        </div>
      )}
    </div>
  )
}
