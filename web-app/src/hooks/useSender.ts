import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import type { AlertDialogState, AlertType, TransferMetadata, TransferProgress } from '../types/sender'

export interface UseSenderReturn {
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
  const [isStopping, setIsStopping] = useState(false)
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  })

  // Refs for event ingestion (backend as source of truth)
  const latestProgressRef = useRef<TransferProgress | null>(null)
  const transferStartTimeRef = useRef<number | null>(null)
  const progressUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isCompletedRef = useRef(false)
  const wasManuallyStoppedRef = useRef(false)
  const selectedPathRef = useRef<string | null>(null)

  // Keep selectedPathRef in sync with state
  useEffect(() => {
    selectedPathRef.current = selectedPath
  }, [selectedPath])

  // Setup event listeners ONCE on mount (empty dependency array)
  useEffect(() => {
    let unlistenStart: UnlistenFn | undefined
    let unlistenProgress: UnlistenFn | undefined
    let unlistenComplete: UnlistenFn | undefined
    let unlistenFailed: UnlistenFn | undefined

    const setupListeners = async () => {
      // transfer-started: Store in ref immediately, start controlled update interval
      unlistenStart = await listen('transfer-started', () => {
        transferStartTimeRef.current = Date.now()
        isCompletedRef.current = false
        latestProgressRef.current = null
        
        // Update React state
        setIsTransporting(true)
        setIsCompleted(false)
        setTransferProgress(null)
        setTransferMetadata(null)
        wasManuallyStoppedRef.current = false
        setIsStopping(false)
        
        // Start controlled update interval (50ms = ~20 FPS)
        if (progressUpdateIntervalRef.current) {
          clearInterval(progressUpdateIntervalRef.current)
        }
        progressUpdateIntervalRef.current = setInterval(() => {
          if (latestProgressRef.current && !isCompletedRef.current) {
            setTransferProgress(latestProgressRef.current)
          }
        }, 50)
      })

      // transfer-progress: Store in ref immediately, interval updates React
      unlistenProgress = await listen('transfer-progress', (event: any) => {
        try {
          const payload = event.payload as string
          const parts = payload.split(':')
          
          if (parts.length === 3) {
            const bytesTransferred = parseInt(parts[0], 10)
            const totalBytes = parseInt(parts[1], 10)
            const speedInt = parseInt(parts[2], 10)
            const speedBps = speedInt / 1000.0
            const percentage = totalBytes > 0 ? (bytesTransferred / totalBytes) * 100 : 0
            
            // Store immediately in ref (no React render triggered)
            latestProgressRef.current = {
              bytesTransferred,
              totalBytes,
              speedBps,
              percentage
            }
            // Interval will update React state at controlled pace
          }
        } catch (error) {
          console.error('Failed to parse progress event:', error)
        }
      })

      // transfer-completed: Flush state and complete
      unlistenComplete = await listen('transfer-completed', async () => {
        if (wasManuallyStoppedRef.current) {
          return
        }
        
        // Stop interval updates
        if (progressUpdateIntervalRef.current) {
          clearInterval(progressUpdateIntervalRef.current)
          progressUpdateIntervalRef.current = null
        }
        
        isCompletedRef.current = true
        
        // Flush final progress if any
        if (latestProgressRef.current) {
          setTransferProgress(latestProgressRef.current)
        }
        
        // Small delay to ensure state commit
        await new Promise(resolve => setTimeout(resolve, 10))
        
        setIsTransporting(false)
        setIsCompleted(true)
        setTransferProgress(null)
        
        const endTime = Date.now()
        const duration = transferStartTimeRef.current 
          ? endTime - transferStartTimeRef.current 
          : 0
        
        const currentPath = selectedPathRef.current
        if (currentPath) {
          try {
            const fileSize = await invoke<number>('get_file_size', { path: currentPath })
            const fileName = currentPath.split('/').pop() || 'Unknown'
            setTransferMetadata({ 
              fileName, 
              fileSize, 
              duration, 
              startTime: transferStartTimeRef.current || endTime, 
              endTime 
            })
          } catch (error) {
            console.error('Failed to get file size:', error)
            const fileName = currentPath.split('/').pop() || 'Unknown'
            setTransferMetadata({ 
              fileName, 
              fileSize: 0, 
              duration, 
              startTime: transferStartTimeRef.current || endTime, 
              endTime 
            })
          }
        }
      })

      // transfer-failed: Similar cleanup
      unlistenFailed = await listen('transfer-failed', async () => {
        if (wasManuallyStoppedRef.current) {
          return
        }
        
        // Stop interval updates
        if (progressUpdateIntervalRef.current) {
          clearInterval(progressUpdateIntervalRef.current)
          progressUpdateIntervalRef.current = null
        }
        
        isCompletedRef.current = true
        setIsTransporting(false)
        setIsCompleted(true)
        setTransferProgress(null)
        
        const endTime = Date.now()
        const duration = transferStartTimeRef.current 
          ? endTime - transferStartTimeRef.current 
          : 0
        
        const currentPath = selectedPathRef.current
        if (currentPath) {
          const fileName = currentPath.split('/').pop() || 'Unknown'
          setTransferMetadata({ 
            fileName, 
            fileSize: 0, 
            duration, 
            startTime: transferStartTimeRef.current || endTime, 
            endTime,
            wasStopped: true
          })
        }
      })
    }

    setupListeners().catch((error) => {
      console.error('Failed to set up event listeners:', error)
    })

    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current)
      }
      if (unlistenStart) unlistenStart()
      if (unlistenProgress) unlistenProgress()
      if (unlistenComplete) unlistenComplete()
      if (unlistenFailed) unlistenFailed()
    }
  }, []) // Empty deps - setup once only on mount

  const showAlert = (title: string, description: string, type: AlertType = 'info') => {
    setAlertDialog({ isOpen: true, title, description, type })
  }

  const closeAlert = () => {
    setAlertDialog(prev => ({ ...prev, isOpen: false }))
  }

  const handleFileSelect = async (path: string) => {
    setSelectedPath(path)
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
      isCompletedRef.current = false
      setIsCompleted(false)
      setIsTransporting(false)
      setTransferMetadata(null)
      setTransferProgress(null)
      transferStartTimeRef.current = null
      wasManuallyStoppedRef.current = false
      latestProgressRef.current = null
      
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
      const wasActiveTransfer = (isSharing || isTransporting) && 
                                !isCompleted &&
                                (!transferMetadata || !transferMetadata.wasStopped)
      const isCompletedTransfer = isCompleted && transferMetadata
      
      const currentSelectedPath = selectedPathRef.current
      const currentTransferStartTime = transferStartTimeRef.current
      
      if (wasActiveTransfer && currentSelectedPath) {
        wasManuallyStoppedRef.current = true
        
        // Stop interval updates
        if (progressUpdateIntervalRef.current) {
          clearInterval(progressUpdateIntervalRef.current)
          progressUpdateIntervalRef.current = null
        }
        
        const endTime = Date.now()
        const fileName = currentSelectedPath.split('/').pop() || 'Unknown'
        
        const stoppedMetadata: TransferMetadata = {
          fileName,
          fileSize: 0,
          duration: 0,
          startTime: currentTransferStartTime || endTime,
          endTime,
          wasStopped: true
        }
        
        setTransferMetadata(stoppedMetadata)
        setIsCompleted(true)
        setIsTransporting(false)
        
        setIsStopping(true)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsStopping(false))
        })
      }
      
      if (isCompletedTransfer) {
        wasManuallyStoppedRef.current = false
        setIsSharing(false)
        setIsTransporting(false)
        setIsCompleted(false)
        setTransferMetadata(null)
        setTicket(null)
        setSelectedPath(null)
        setPathType(null)
        setTransferProgress(null)
        transferStartTimeRef.current = null
        
        invoke('stop_sharing').catch((error) => {
          console.warn('Background cleanup failed (non-critical):', error)
        })
        return
      }
      
      await invoke('stop_sharing')
      
      if (!wasActiveTransfer || !currentSelectedPath) {
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
      transferStartTimeRef.current = null
    } catch (error) {
      console.error('Failed to stop sharing:', error)
      setIsStopping(false)
      showAlert('Stop Sharing Failed', `Failed to stop sharing: ${error}`, 'error')
    }
  }

  const resetForNewTransfer = async () => {
    await stopSharing()
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
    
    handleFileSelect,
    startSharing,
    stopSharing,
    copyTicket,
    showAlert,
    closeAlert,
    resetForNewTransfer
  }
}
