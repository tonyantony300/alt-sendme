import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Download } from 'lucide-react'

export function Receiver() {
  const [ticket, setTicket] = useState('')
  const [isReceiving, setIsReceiving] = useState(false)

  const handleReceive = async () => {
    if (!ticket.trim()) return
    
    try {
      setIsReceiving(true)
      const result = await invoke<string>('receive_file', { ticket: ticket.trim() })
      alert('File received successfully!\n\n' + result)
      setTicket('')
    } catch (error) {
      console.error('Failed to receive file:', error)
      alert('Failed to receive file: ' + error)
    } finally {
      setIsReceiving(false)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setTicket(text)
    } catch (error) {
      console.error('Failed to read clipboard:', error)
      alert('Failed to read from clipboard: ' + error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Receive Files</h2>
        <p className="text-sm text-gray-600">
          Download files shared by others using their ticket
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paste the ticket here:
          </label>
          <textarea
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
            placeholder="sendme receive [ticket]..."
            className="w-full p-3 border border-gray-300 rounded-md text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePaste}
            className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Paste from Clipboard
          </button>
        </div>

        <button
          onClick={handleReceive}
          disabled={!ticket.trim() || isReceiving}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Download className="h-4 w-4 mr-2" />
          {isReceiving ? 'Receiving...' : 'Receive File'}
        </button>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">How to receive files:</h3>
          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
            <li>Get a ticket from someone who is sharing a file</li>
            <li>Paste the ticket in the text area above</li>
            <li>Click "Receive File" to start downloading</li>
            <li>Files will be saved to your Downloads folder</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
