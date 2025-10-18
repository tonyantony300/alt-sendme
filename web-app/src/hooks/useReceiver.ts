import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { AlertDialogState, AlertType } from '../types/sender'

export interface UseReceiverReturn {
  // State
  ticket: string
  isReceiving: boolean
  alertDialog: AlertDialogState
  
  // Actions
  handleTicketChange: (ticket: string) => void
  handleReceive: () => Promise<void>
  showAlert: (title: string, description: string, type?: AlertType) => void
  closeAlert: () => void
}

export function useReceiver(): UseReceiverReturn {
  const [ticket, setTicket] = useState('')
  const [isReceiving, setIsReceiving] = useState(false)
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

  const handleTicketChange = (newTicket: string) => {
    setTicket(newTicket)
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

  return {
    // State
    ticket,
    isReceiving,
    alertDialog,
    
    // Actions
    handleTicketChange,
    handleReceive,
    showAlert,
    closeAlert
  }
}
