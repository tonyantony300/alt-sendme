import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import type { AlertDialogState, AlertType, TransferMetadata, TransferProgress } from '../types/sender'

export interface UseSenderReturn {
  // State
  isSharing: boolean
  isTransporting: boolean
  isCompleted: boolean
  ticket: string | null
  selectedPath: string | null
  pathType: 'file' | 'directory' | null
  isLoading: boolean
  isStopping: boolean
  copySuccess: boolean
  alertDialog: AlertDialogState
  transferMetadata: TransferMetadata | null
  transferProgress: TransferProgress | null
  
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
  const [pathType, setPathType] = useState<'file' | 'directory' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [transferMetadata, setTransferMetadata] = useState<TransferMetadata | null>(null)
  const [transferProgress, setTransferProgress] = useState<TransferProgress | null>(null)
  const [transferStartTime, setTransferStartTime] = useState<number | null>(null)
  const [isStopping, setIsStopping] = useState(false)
  const wasManuallyStoppedRef = useRef(false)
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  })

  // Listen for transfer events from Rust backend
  useEffect(() => {
    let unlistenStart: UnlistenFn | undefined
    let unlistenProgress: UnlistenFn | undefined
    let unlistenComplete: UnlistenFn | undefined

    const setupListeners = async () => {
      // Listen for transfer started event
      unlistenStart = await listen('transfer-started', () => {
        setIsTransporting(true)
        setIsCompleted(false)
        setTransferStartTime(Date.now())
        setTransferProgress(null) // Reset progress
        setTransferMetadata(null) // Reset metadata from previous transfer
        wasManuallyStoppedRef.current = false // Reset stopped flag when new transfer starts
        setIsStopping(false) // Reset stopping flag when new transfer starts
      })

      // Listen for transfer progress events
      unlistenProgress = await listen('transfer-progress', (event: any) => {
        // Parse the payload from the event
        // The payload is in event.payload as a string: "bytes_transferred:total_bytes:speed_int"
        try {
          const payload = event.payload as string
          const parts = payload.split(':')
          
          if (parts.length === 3) {
            const bytesTransferred = parseInt(parts[0], 10)
            const totalBytes = parseInt(parts[1], 10)
            const speedInt = parseInt(parts[2], 10)
            // Convert speed back from integer (divide by 1000 to get original value)
            const speedBps = speedInt / 1000.0
            const percentage = totalBytes > 0 ? (bytesTransferred / totalBytes) * 100 : 0
            
            setTransferProgress({
              bytesTransferred,
              totalBytes,
              speedBps,
              percentage
            })
          }
        } catch (error) {
          console.error('Failed to parse progress event:', error)
        }
      })

      // Listen for transfer completed event
      unlistenComplete = await listen('transfer-completed', async () => {
        // Ignore transfer-completed event if we manually stopped the transfer
        // This prevents the event from overwriting the stopped metadata
        if (wasManuallyStoppedRef.current) {
          return
        }
        
        setIsTransporting(false)
        setIsCompleted(true)
        setTransferProgress(null) // Clear progress on completion
        
        // Calculate transfer metadata
        const endTime = Date.now()
        const duration = transferStartTime ? endTime - transferStartTime : 0
        
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
            setTransferMetadata(metadata)
          }
        }
      })
    }

    setupListeners().catch((error) => {
      console.error('Failed to set up event listeners:', error)
    })

    // Cleanup listeners on unmount
    return () => {
      if (unlistenStart) unlistenStart()
      if (unlistenProgress) unlistenProgress()
      if (unlistenComplete) unlistenComplete()
    }
  }, [transferStartTime, selectedPath])

  const showAlert = (title: string, description: string, type: AlertType = 'info') => {
    setAlertDialog({ isOpen: true, title, description, type })
  }

  const closeAlert = () => {
    setAlertDialog(prev => ({ ...prev, isOpen: false }))
  }

  const handleFileSelect = async (path: string) => {
    setSelectedPath(path)
    // Check path type when file is selected
    try {
      const type = await invoke<string>('check_path_type', { path })
      setPathType(type as 'file' | 'directory')
    } catch (error) {
      console.error('Failed to check path type:', error)
      setPathType(null)
    }
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
      // Check if we're stopping during an active transfer (not completed yet)
      // Don't treat a completed transfer as an active one
      const wasActiveTransfer = (isSharing || isTransporting) && 
                                !isCompleted &&
                                (!transferMetadata || !transferMetadata.wasStopped)
      // Capture values before clearing
      const currentSelectedPath = selectedPath
      const currentTransferStartTime = transferStartTime
      
      // If we were in an active transfer, set stopping state and prepare metadata immediately
      if (wasActiveTransfer && currentSelectedPath) {
        // Mark that we manually stopped IMMEDIATELY to prevent transfer-completed event from overwriting
        wasManuallyStoppedRef.current = true
        
        const endTime = Date.now()
        const fileName = currentSelectedPath.split('/').pop() || 'Unknown'
        
        // Create metadata with zero/stopped values immediately (before async call)
        const stoppedMetadata: TransferMetadata = {
          fileName,
          fileSize: 0,
          duration: 0,
          startTime: currentTransferStartTime || endTime,
          endTime,
          wasStopped: true
        }
        
        // Set metadata and states immediately to show stopped screen
        setTransferMetadata(stoppedMetadata)
        setIsCompleted(true)
        setIsTransporting(false)
        // Keep isSharing true so we stay in the sharing state to show success screen
        
        // Show loader briefly during transition to smooth out React render cycle
        setIsStopping(true)
        // Clear loader after React has a chance to batch and render state updates
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsStopping(false))
        })
      }
      
      // Now call the backend to stop sharing
      await invoke('stop_sharing')
      
      // After backend completes, finish cleanup
      if (!wasActiveTransfer || !currentSelectedPath) {
        // Normal reset (e.g., after viewing success screen)
        wasManuallyStoppedRef.current = false
        setIsSharing(false)
        setIsTransporting(false)
        setIsCompleted(false)
        setTransferMetadata(null)
      }
      
      setTicket(null)
      setSelectedPath(null)
      setPathType(null)
      setTransferProgress(null)
      setTransferStartTime(null)
    } catch (error) {
      console.error('Failed to stop sharing:', error)
      setIsStopping(false)
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
    pathType,
    isLoading,
    isStopping,
    copySuccess,
    alertDialog,
    transferMetadata,
    transferProgress,
    
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
