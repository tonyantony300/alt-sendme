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
  const [transferStartTime, setTransferStartTime] = useState<number | null>(null)
  const [isStopping, setIsStopping] = useState(false)
  const wasManuallyStoppedRef = useRef(false)
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  })

  useEffect(() => {
    let unlistenStart: UnlistenFn | undefined
    let unlistenProgress: UnlistenFn | undefined
    let unlistenComplete: UnlistenFn | undefined
    let unlistenFailed: UnlistenFn | undefined
    let progressUpdateTimeout: NodeJS.Timeout | undefined

    const setupListeners = async () => {
      unlistenStart = await listen('transfer-started', () => {
        setIsTransporting(true)
        setIsCompleted(false)
        setTransferStartTime(Date.now())
        setTransferProgress(null)
        setTransferMetadata(null)
        wasManuallyStoppedRef.current = false
        setIsStopping(false)
      })

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
            
            if (progressUpdateTimeout) {
              clearTimeout(progressUpdateTimeout)
            }
            
            progressUpdateTimeout = setTimeout(() => {
              setTransferProgress({
                bytesTransferred,
                totalBytes,
                speedBps,
                percentage
              })
            }, 100)
          }
        } catch (error) {
          console.error('Failed to parse progress event:', error)
        }
      })

      unlistenComplete = await listen('transfer-completed', async () => {
        if (wasManuallyStoppedRef.current) {
          return
        }
        
        if (progressUpdateTimeout) {
          clearTimeout(progressUpdateTimeout)
        }
        
        setIsTransporting(false)
        setIsCompleted(true)
        setTransferProgress(null)
        
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

      unlistenFailed = await listen('transfer-failed', async () => {
        if (wasManuallyStoppedRef.current) {
          return
        }
        
        if (progressUpdateTimeout) {
          clearTimeout(progressUpdateTimeout)
        }
        
        setIsTransporting(false)
        setIsCompleted(true)
        setTransferProgress(null)
        
        const endTime = Date.now()
        const duration = transferStartTime ? endTime - transferStartTime : 0
        
        if (selectedPath) {
          const fileName = selectedPath.split('/').pop() || 'Unknown'
          const metadata: TransferMetadata = { 
            fileName, 
            fileSize: 0, 
            duration, 
            startTime: transferStartTime || endTime, 
            endTime,
            wasStopped: true
          }
          setTransferMetadata(metadata)
        }
      })
    }

    setupListeners().catch((error) => {
      console.error('Failed to set up event listeners:', error)
    })

    return () => {
      if (progressUpdateTimeout) {
        clearTimeout(progressUpdateTimeout)
      }
      if (unlistenStart) unlistenStart()
      if (unlistenProgress) unlistenProgress()
      if (unlistenComplete) unlistenComplete()
      if (unlistenFailed) unlistenFailed()
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
      
      const currentSelectedPath = selectedPath
      const currentTransferStartTime = transferStartTime
      
      if (wasActiveTransfer && currentSelectedPath) {
        wasManuallyStoppedRef.current = true
        
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
        setTransferStartTime(null)
        
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
      setTransferStartTime(null)
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
