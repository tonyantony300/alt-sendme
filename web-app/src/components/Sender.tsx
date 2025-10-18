import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { DragDrop } from './DragDrop'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { Copy, X, Share2, CheckCircle } from 'lucide-react'

export function Sender() {
  const [isSharing, setIsSharing] = useState(false)
  const [ticket, setTicket] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
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

  const handleFileSelect = async (path: string) => {
    setSelectedPath(path)
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
      showAlert('Sharing Failed', `Failed to start sharing: ${error}`, 'error')
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
      showAlert('Stop Sharing Failed', `Failed to stop sharing: ${error}`, 'error')
    }
  }

  const copyTicket = async () => {
    if (ticket) {
      try {
        await navigator.clipboard.writeText(ticket)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (error) {
        console.error('Failed to copy ticket:', error)
        showAlert('Copy Failed', `Failed to copy ticket: ${error}`, 'error')
      }
    }
  }

  return (
    <div className="p-6 space-y-6" style={{ color: 'var(--app-main-view-fg)' }}>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
          Send Files
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Share files with others the peer to peer way
        </p>
      </div>

      {!isSharing ? (
        <div className="space-y-4">
          <DragDrop 
            onFileSelect={handleFileSelect} 
            selectedPath={selectedPath}
            isLoading={isLoading}
          />

          {selectedPath && (
            <div className="p-4 rounded-lg border" style={{ 
              backgroundColor: 'rgba(219, 88, 44, 0.1)', 
              borderColor: 'var(--app-primary)' 
            }}>
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 mr-2" style={{ color: 'var(--app-primary)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--app-primary)' }}>
                  File Selected
                </p>
              </div>
              <p className="text-sm mb-3" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <strong>Path:</strong> {selectedPath}
              </p>
              <button
                onClick={startSharing}
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--app-primary)',
                  color: 'var(--app-primary-fg)',
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {isLoading ? 'Starting Share...' : 'Start Sharing'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border" style={{ 
            backgroundColor: 'rgba(45, 120, 220, 0.1)', 
            borderColor: 'var(--app-accent)' 
          }}>
            <div className="flex items-center mb-2">
              <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: 'var(--app-accent)' }}></div>
              <p className="text-sm font-medium" style={{ color: 'var(--app-accent)' }}>
                Sharing Active
              </p>
            </div>
            <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <strong>File:</strong> {selectedPath?.split('/').pop()}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Keep this app open while others download your files
            </p>
          </div>
          
          {ticket && (
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: 'var(--app-main-view-fg)' }}>
                Share this ticket:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ticket}
                  readOnly
                  className="flex-1 p-3 rounded-md text-xs font-mono"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'var(--app-main-view-fg)',
                  }}
                />
                <button
                  onClick={copyTicket}
                  className="px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: copySuccess ? 'var(--app-primary)' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: copySuccess ? 'var(--app-primary-fg)' : 'var(--app-main-view-fg)',
                  }}
                  title="Copy to clipboard"
                >
                  {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Send this ticket to the person who wants to receive your file
              </p>
            </div>
          )}
          
          <button
            onClick={stopSharing}
            className="w-full py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center"
            style={{
              backgroundColor: 'var(--app-destructive)',
              color: 'var(--app-destructive-fg)',
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Stop Sharing
          </button>
        </div>
      )}

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
