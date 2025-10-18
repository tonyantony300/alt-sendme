import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { Download } from 'lucide-react'

export function Receiver() {
  const [ticket, setTicket] = useState('')
  const [isReceiving, setIsReceiving] = useState(false)
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    type: 'success' | 'error' | 'info'
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  })

  const showAlert = (title: string, description: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertDialog({ isOpen: true, title, description, type })
  }

  const handleReceive = async () => {
    if (!ticket.trim()) return
    
    try {
      setIsReceiving(true)
      const result = await invoke<string>('receive_file', { ticket: ticket.trim() })
      showAlert('Success!', `File received successfully!\n\n${result}`, 'success')
      setTicket('')
    } catch (error) {
      console.error('Failed to receive file:', error)
      showAlert('Receive Failed', `Failed to receive file: ${error}`, 'error')
    } finally {
      setIsReceiving(false)
    }
  }


  return (
    <div className="p-6 space-y-6" style={{ color: 'var(--app-main-view-fg)' }}>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
            Paste the ticket here:
          </label>
          <textarea
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
            placeholder="sendme receive [ticket]..."
            className="w-full p-3 rounded-md text-sm font-mono resize-none focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'var(--app-main-view-fg)',
            }}
            rows={4}
          />
        </div>


        <button
          onClick={handleReceive}
          disabled={!ticket.trim() || isReceiving}
          className="w-full py-3 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          style={{
            backgroundColor: 'var(--app-accent)',
            color: 'var(--app-accent-fg)',
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          {isReceiving ? 'Receiving...' : 'Receive File'}
        </button>

        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
          borderColor: 'rgba(255, 255, 255, 0.1)' 
        }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
            How to receive files:
          </h3>
          <ol className="text-xs space-y-1 list-decimal list-inside" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <li>Get a ticket from someone who is sharing a file</li>
            <li>Paste the ticket in the text area above</li>
            <li>Click "Receive File" to start downloading</li>
            <li>Files will be saved to your Downloads folder</li>
          </ol>
        </div>
      </div>

      <AlertDialog open={alertDialog.isOpen} onOpenChange={(open) => setAlertDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
