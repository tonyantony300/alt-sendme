import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import type { AlertDialogState, AlertType, TransferMetadata } from '../types/sender'

export interface UseSenderReturn {
  // State
  isSharing: boolean
  isTransporting: boolean
  isCompleted: boolean
  ticket: string | null
  selectedPath: string | null
  isLoading: boolean
  copySuccess: boolean
  alertDialog: AlertDialogState
  transferMetadata: TransferMetadata | null
  
  // Actions
  handleFileSelect: (path: string) => void
  startSharing: () => Promise<void>
  stopSharing: () => Promise<void>
  copyTicket: () => Promise<void>
  showAlert: (title: string, description: string, type?: AlertType) => void
  closeAlert: () => void
  resetForNewTransfer: () => Promise<void>
}

export function useSender(): UseSenderReturn {
  const [isSharing, setIsSharing] = useState(false)
  const [isTransporting, setIsTransporting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [ticket, setTicket] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [transferMetadata, setTransferMetadata] = useState<TransferMetadata | null>(null)
  const [transferStartTime, setTransferStartTime] = useState<number | null>(null)
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  })

  // Listen for transfer events from Rust backend
  useEffect(() => {
    let unlistenStart: UnlistenFn | undefined
    let unlistenComplete: UnlistenFn | undefined

    const setupListeners = async () => {
      // Listen for transfer started event
      unlistenStart = await listen('transfer-started', () => {
        setIsTransporting(true)
        setIsCompleted(false)
        setTransferStartTime(Date.now())
      })

      // Listen for transfer completed event
      unlistenComplete = await listen('transfer-completed', async () => {
        console.log('🟢 Transfer completed event received!')
        setIsTransporting(false)
        setIsCompleted(true)
        
        // Calculate transfer metadata
        const endTime = Date.now()
        const duration = transferStartTime ? endTime - transferStartTime : 0
        
        console.log('📊 Transfer metadata calculation:', {
          transferStartTime,
          endTime,
          duration,
          selectedPath
        })
        
        if (selectedPath) {
          try {
            const fileSize = await invoke<number>('get_file_size', { path: selectedPath })
            const fileName = selectedPath.split('/').pop() || 'Unknown'
            const metadata = { 
              fileName, 
              fileSize, 
              duration, 
              startTime: transferStartTime || endTime, 
              endTime 
            }
            console.log('✅ Setting transfer metadata:', metadata)
            setTransferMetadata(metadata)
          } catch (error) {
            console.error('Failed to get file size:', error)
            const fileName = selectedPath.split('/').pop() || 'Unknown'
            const metadata = { 
              fileName, 
              fileSize: 0, 
              duration, 
              startTime: transferStartTime || endTime, 
              endTime 
            }
            console.log('⚠️ Setting transfer metadata with fallback:', metadata)
            setTransferMetadata(metadata)
          }
        } else {
          console.warn('❌ No selectedPath available for metadata')
        }
      })
    }

    setupListeners().catch((error) => {
      console.error('Failed to set up event listeners:', error)
    })

    // Cleanup listeners on unmount
    return () => {
      if (unlistenStart) unlistenStart()
      if (unlistenComplete) unlistenComplete()
    }
  }, [transferStartTime, selectedPath])

  const showAlert = (title: string, description: string, type: AlertType = 'info') => {
    setAlertDialog({ isOpen: true, title, description, type })
  }

  const closeAlert = () => {
    setAlertDialog(prev => ({ ...prev, isOpen: false }))
  }

  const handleFileSelect = (path: string) => {
    setSelectedPath(path)
  }

  const startSharing = async () => {
    if (!selectedPath) return
    
    try {
      setIsLoading(true)
      const result = await invoke<string>('start_sharing', { path: selectedPath })
      setTicket(result)
      setIsSharing(true)
      // isTransporting will be updated by event listeners when actual transfer begins
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
      setIsTransporting(false)
      setIsCompleted(false)
      setTicket(null)
      setSelectedPath(null)
      setTransferMetadata(null)
      setTransferStartTime(null)
    } catch (error) {
      console.error('Failed to stop sharing:', error)
      showAlert('Stop Sharing Failed', `Failed to stop sharing: ${error}`, 'error')
    }
  }

  const resetForNewTransfer = async () => {
    await stopSharing()
    // Keep user in file selection screen
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

  return {
    // State
    isSharing,
    isTransporting,
    isCompleted,
    ticket,
    selectedPath,
    isLoading,
    copySuccess,
    alertDialog,
    transferMetadata,
    
    // Actions
    handleFileSelect,
    startSharing,
    stopSharing,
    copyTicket,
    showAlert,
    closeAlert,
    resetForNewTransfer
  }
}
