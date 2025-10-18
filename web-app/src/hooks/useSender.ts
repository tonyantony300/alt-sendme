import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { AlertDialogState, AlertType } from '../types/sender'

export interface UseSenderReturn {
  // State
  isSharing: boolean
  ticket: string | null
  selectedPath: string | null
  isLoading: boolean
  copySuccess: boolean
  alertDialog: AlertDialogState
  
  // Actions
  handleFileSelect: (path: string) => void
  startSharing: () => Promise<void>
  stopSharing: () => Promise<void>
  copyTicket: () => Promise<void>
  showAlert: (title: string, description: string, type?: AlertType) => void
  closeAlert: () => void
}

export function useSender(): UseSenderReturn {
  const [isSharing, setIsSharing] = useState(false)
  const [ticket, setTicket] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  })

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

  return {
    // State
    isSharing,
    ticket,
    selectedPath,
    isLoading,
    copySuccess,
    alertDialog,
    
    // Actions
    handleFileSelect,
    startSharing,
    stopSharing,
    copyTicket,
    showAlert,
    closeAlert
  }
}
