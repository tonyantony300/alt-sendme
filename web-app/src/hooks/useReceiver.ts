import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/plugin-dialog'
import { downloadDir } from '@tauri-apps/api/path'
import type { AlertDialogState, AlertType, TransferMetadata, TransferProgress } from '../types/sender'

export interface ExportProgress {
  current: number
  total: number
  percentage: number
}

export interface UseReceiverReturn {
  ticket: string
  isReceiving: boolean
  isTransporting: boolean
  isExporting: boolean
  isCompleted: boolean
  savePath: string
  alertDialog: AlertDialogState
  transferMetadata: TransferMetadata | null
  transferProgress: TransferProgress | null
  fileNames: string[]
  exportProgress: ExportProgress | null
  resumedFrom: number | null
  
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
  const [isExporting, setIsExporting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [savePath, setSavePath] = useState('')
  const [transferMetadata, setTransferMetadata] = useState<TransferMetadata | null>(null)
  const [transferProgress, setTransferProgress] = useState<TransferProgress | null>(null)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  const [resumedFrom, setResumedFrom] = useState<number | null>(null)
  const [transferStartTime, setTransferStartTime] = useState<number | null>(null)
  const [fileNames, setFileNames] = useState<string[]>([])
  
  const fileNamesRef = useRef<string[]>([])
  const transferProgressRef = useRef<TransferProgress | null>(null)
  const transferStartTimeRef = useRef<number | null>(null)
  
  useEffect(() => {
    fileNamesRef.current = fileNames
  }, [fileNames])
  
  useEffect(() => {
    transferProgressRef.current = transferProgress
  }, [transferProgress])
  
  useEffect(() => {
    transferStartTimeRef.current = transferStartTime
  }, [transferStartTime])
  
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  })

  useEffect(() => {
    const initializeSavePath = async () => {
      try {
        const downloadsPath = await downloadDir()
        setSavePath(downloadsPath)
      } catch (error) {
        // // console.error('Failed to get downloads directory:', error)
        setSavePath('')
      }
    }
    initializeSavePath()
  }, [])

  useEffect(() => {
    let unlistenStart: UnlistenFn | undefined
    let unlistenProgress: UnlistenFn | undefined
    let unlistenComplete: UnlistenFn | undefined
    let unlistenFileNames: UnlistenFn | undefined
    let unlistenResumed: UnlistenFn | undefined
    let unlistenExportStart: UnlistenFn | undefined
    let unlistenExportProgress: UnlistenFn | undefined
    let unlistenExportComplete: UnlistenFn | undefined

    const setupListeners = async () => {
      unlistenStart = await listen('receive-started', () => {
        setIsTransporting(true)
        setIsCompleted(false)
        setTransferStartTime(Date.now())
        setTransferProgress(null)
      })

      unlistenResumed = await listen('receive-resumed', (event: any) => {
        try {
          const localSize = parseInt(event.payload as string, 10)
          // // console.log('[Receive] Resuming from:', localSize, 'bytes')
          setResumedFrom(localSize)
          setTimeout(() => setResumedFrom(null), 5000)
        } catch (error) {
          // // console.error('Failed to parse resume event:', error)
        }
      })

      unlistenProgress = await listen('receive-progress', (event: any) => {
        try {
          const payload = event.payload as string
          const parts = payload.split(':')
          
          if (parts.length === 3) {
            const bytesTransferred = parseInt(parts[0], 10)
            const totalBytes = parseInt(parts[1], 10)
            const speedInt = parseInt(parts[2], 10)
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
          // // console.error('Failed to parse progress event:', error)
        }
      })

      unlistenFileNames = await listen('receive-file-names', (event: any) => {
        try {
          const payload = event.payload as string
          const names = JSON.parse(payload) as string[]
          
          setFileNames(names)
          fileNamesRef.current = names
        } catch (error) {
          // // console.error('Failed to parse file names event:', error)
        }
      })

      unlistenExportStart = await listen('export-started', (event: any) => {
        try {
          const total = parseInt(event.payload as string, 10)
          // // console.log('[Export] Started, total files:', total)
          setIsExporting(true)
          setExportProgress({ current: 0, total, percentage: 0 })
        } catch (error) {
          // // console.error('Failed to parse export start event:', error)
        }
      })

      unlistenExportProgress = await listen('export-progress', (event: any) => {
        try {
          const payload = event.payload as string
          const parts = payload.split(':')
          
          if (parts.length === 3) {
            const current = parseInt(parts[0], 10)
            const total = parseInt(parts[1], 10)
            const percentage = parseInt(parts[2], 10)
            // // console.log('[Export] Progress:', current, '/', total, `(${percentage}%)`)
            setExportProgress({ current, total, percentage })
          }
        } catch (error) {
          // // console.error('Failed to parse export progress event:', error)
        }
      })

      unlistenExportComplete = await listen('export-completed', () => {
        // // console.log('[Export] Completed')
        setIsExporting(false)
        setExportProgress(null)
      })

      unlistenComplete = await listen('receive-completed', async () => {
        setIsTransporting(false)
        setIsCompleted(true)
        setTransferProgress(null)
        
        const endTime = Date.now()
        const duration = transferStartTimeRef.current ? endTime - transferStartTimeRef.current : 0
        
        const currentFileNames = fileNamesRef.current
        let displayName = 'Downloaded File'
        
        if (currentFileNames.length > 0) {
          if (currentFileNames.length === 1) {
            const fullPath = currentFileNames[0]
            displayName = fullPath.split('/').pop() || fullPath
          } else {
            const firstPath = currentFileNames[0]
            const pathParts = firstPath.split('/')
            if (pathParts.length > 1) {
              displayName = pathParts[0] || `${currentFileNames.length} files`
            } else {
              displayName = `${currentFileNames.length} files`
            }
          }
        }
        
        const metadata = {
          fileName: displayName,
          fileSize: transferProgressRef.current?.totalBytes || 0,
          duration,
          startTime: transferStartTimeRef.current || endTime,
          endTime,
          downloadPath: savePath
        }
        setTransferMetadata(metadata)
      })
    }

    setupListeners().catch((error) => {
      // // console.error('Failed to set up event listeners:', error)
    })

    return () => {
      if (unlistenStart) unlistenStart()
      if (unlistenProgress) unlistenProgress()
      if (unlistenComplete) unlistenComplete()
      if (unlistenFileNames) unlistenFileNames()
      if (unlistenResumed) unlistenResumed()
      if (unlistenExportStart) unlistenExportStart()
      if (unlistenExportProgress) unlistenExportProgress()
      if (unlistenExportComplete) unlistenExportComplete()
    }
  }, [transferStartTime, transferProgress])

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
      // // console.error('Failed to open folder dialog:', error)
      showAlert('Folder Dialog Failed', `Failed to open folder dialog: ${error}`, 'error')
    }
  }

  const handleReceive = async () => {
    if (!ticket.trim()) return
    
    try {
      setIsReceiving(true)
      setIsTransporting(false)
      setIsExporting(false)
      setIsCompleted(false)
      setTransferMetadata(null)
      setTransferProgress(null)
      setExportProgress(null)
      setResumedFrom(null)
      setTransferStartTime(null)
      
      await invoke<string>('receive_file', { 
        ticket: ticket.trim(),
        outputPath: savePath
      })
    } catch (error) {
      // // console.error('Failed to receive file:', error)
      showAlert('Receive Failed', `Failed to receive file: ${error}`, 'error')
      setIsReceiving(false)
      setIsTransporting(false)
      setIsExporting(false)
      setIsCompleted(false)
    }
  }

  const resetForNewTransfer = async () => {
    setIsReceiving(false)
    setIsTransporting(false)
    setIsExporting(false)
    setIsCompleted(false)
    setTicket('')
    setTransferMetadata(null)
    setTransferProgress(null)
    setExportProgress(null)
    setResumedFrom(null)
    setTransferStartTime(null)
    setFileNames([])
  }

  return {
    ticket,
    isReceiving,
    isTransporting,
    isExporting,
    isCompleted,
    savePath,
    alertDialog,
    transferMetadata,
    transferProgress,
    fileNames,
    exportProgress,
    resumedFrom,
    
    handleTicketChange,
    handleBrowseFolder,
    handleReceive,
    showAlert,
    closeAlert,
    resetForNewTransfer
  }
}
