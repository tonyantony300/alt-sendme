import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/plugin-dialog'
import { downloadDir } from '@tauri-apps/api/path'
import type { AlertDialogState, AlertType, TransferMetadata, TransferProgress } from '../types/sender'

export interface UseReceiverReturn {
  // State
  ticket: string
  isReceiving: boolean
  isTransporting: boolean
  isCompleted: boolean
  savePath: string
  alertDialog: AlertDialogState
  transferMetadata: TransferMetadata | null
  transferProgress: TransferProgress | null
  fileNames: string[]
  
  // Actions
  handleTicketChange: (ticket: string) => void
  handleBrowseFolder: () => Promise<void>
  handleReceive: () => Promise<void>
  showAlert: (title: string, description: string, type?: AlertType) => void
  closeAlert: () => void
  resetForNewTransfer: () => Promise<void>
}

export function useReceiver(): UseReceiverReturn {
  const [ticket, setTicket] = useState('')
  const [isReceiving, setIsReceiving] = useState(false)
  const [isTransporting, setIsTransporting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [savePath, setSavePath] = useState('')
  const [transferMetadata, setTransferMetadata] = useState<TransferMetadata | null>(null)
  const [transferProgress, setTransferProgress] = useState<TransferProgress | null>(null)
  const [transferStartTime, setTransferStartTime] = useState<number | null>(null)
  const [fileNames, setFileNames] = useState<string[]>([])
  
  // Use refs to store latest values for the event handlers
  const fileNamesRef = useRef<string[]>([])
  const transferProgressRef = useRef<TransferProgress | null>(null)
  const transferStartTimeRef = useRef<number | null>(null)
  const savePathRef = useRef<string>('')
  
  // Update refs when state changes
  useEffect(() => {
    fileNamesRef.current = fileNames
  }, [fileNames])
  
  useEffect(() => {
    transferProgressRef.current = transferProgress
  }, [transferProgress])
  
  useEffect(() => {
    transferStartTimeRef.current = transferStartTime
  }, [transferStartTime])
  
  useEffect(() => {
    savePathRef.current = savePath
  }, [savePath])
  
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  })

  // Initialize savePath with Downloads folder
  useEffect(() => {
    const initializeSavePath = async () => {
      try {
        const downloadsPath = await downloadDir()
        setSavePath(downloadsPath)
      } catch (error) {
        console.error('Failed to get downloads directory:', error)
        // Fallback to current directory
        setSavePath('')
      }
    }
    initializeSavePath()
  }, [])

  // Listen for transfer events from Rust backend
  useEffect(() => {
    let unlistenStart: UnlistenFn | undefined
    let unlistenProgress: UnlistenFn | undefined
    let unlistenComplete: UnlistenFn | undefined
    let unlistenFileNames: UnlistenFn | undefined

    const setupListeners = async () => {
      // Listen for receive started event
      unlistenStart = await listen('receive-started', () => {
        setIsTransporting(true)
        setIsCompleted(false)
        setTransferStartTime(Date.now())
        setTransferProgress(null) // Reset progress
      })

      // Listen for receive progress events
      unlistenProgress = await listen('receive-progress', (event: any) => {
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

      // Listen for file names event
      unlistenFileNames = await listen('receive-file-names', (event: any) => {
        try {
          const payload = event.payload as string
          const names = JSON.parse(payload) as string[]
          
          // Update BOTH state and ref immediately
          setFileNames(names)
          fileNamesRef.current = names  // CRITICAL: Update ref immediately!
        } catch (error) {
          console.error('Failed to parse file names event:', error)
        }
      })

      // Listen for receive completed event
      unlistenComplete = await listen('receive-completed', () => {
        setIsTransporting(false)
        setIsCompleted(true)
        setTransferProgress(null) // Clear progress on completion
        
        // Calculate transfer metadata using refs to get latest values
        const endTime = Date.now()
        const duration = transferStartTimeRef.current ? endTime - transferStartTimeRef.current : 0
        
        // Get the display name based on file names
        const currentFileNames = fileNamesRef.current
        let displayName = 'Downloaded File'
        
        if (currentFileNames.length > 0) {
          if (currentFileNames.length === 1) {
            // Single file/folder: extract just the name from the path
            const fullPath = currentFileNames[0]
            displayName = fullPath.split('/').pop() || fullPath
          } else {
            // Multiple files: show folder name from first file's path or count
            const firstPath = currentFileNames[0]
            const pathParts = firstPath.split('/')
            // If there's a common parent folder, use it, otherwise just show count
            if (pathParts.length > 1) {
              displayName = pathParts[0] || `${currentFileNames.length} files`
            } else {
              displayName = `${currentFileNames.length} files`
            }
          }
        }
        
        // Set metadata with the correct file name
        const metadata = {
          fileName: displayName,
          fileSize: transferProgressRef.current?.totalBytes || 0,
          duration,
          startTime: transferStartTimeRef.current || endTime,
          endTime,
          downloadPath: savePathRef.current
        }
        setTransferMetadata(metadata)
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
      if (unlistenFileNames) unlistenFileNames()
    }
  }, [])

  const showAlert = (title: string, description: string, type: AlertType = 'info') => {
    setAlertDialog({ isOpen: true, title, description, type })
  }

  const closeAlert = () => {
    setAlertDialog(prev => ({ ...prev, isOpen: false }))
  }

  const handleTicketChange = (newTicket: string) => {
    setTicket(newTicket)
  }

  const handleBrowseFolder = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: true,
      })
      
      if (selected) {
        setSavePath(selected)
      }
    } catch (error) {
      console.error('Failed to open folder dialog:', error)
      showAlert('Folder Dialog Failed', `Failed to open folder dialog: ${error}`, 'error')
    }
  }

  const handleReceive = async () => {
    if (!ticket.trim()) return
    
    try {
      setIsReceiving(true)
      setIsTransporting(false)
      setIsCompleted(false)
      setTransferMetadata(null)
      setTransferProgress(null)
      setTransferStartTime(null)
      
      await invoke<string>('receive_file', { 
        ticket: ticket.trim(),
        outputPath: savePath
      })
      // Don't show alert here - let the event listeners handle the UI updates
      // The success will be shown via the success screen
    } catch (error) {
      console.error('Failed to receive file:', error)
      showAlert('Receive Failed', `Failed to receive file: ${error}`, 'error')
      setIsReceiving(false)
      setIsTransporting(false)
      setIsCompleted(false)
    }
  }

  const resetForNewTransfer = async () => {
    setIsReceiving(false)
    setIsTransporting(false)
    setIsCompleted(false)
    setTicket('')
    setTransferMetadata(null)
    setTransferProgress(null)
    setTransferStartTime(null)
    setFileNames([])
  }

  return {
    // State
    ticket,
    isReceiving,
    isTransporting,
    isCompleted,
    savePath,
    alertDialog,
    transferMetadata,
    transferProgress,
    fileNames,
    
    // Actions
    handleTicketChange,
    handleBrowseFolder,
    handleReceive,
    showAlert,
    closeAlert,
    resetForNewTransfer
  }
}
