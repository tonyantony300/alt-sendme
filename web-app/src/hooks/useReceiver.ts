import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/plugin-dialog'
import { downloadDir, join } from '@tauri-apps/api/path'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { useTranslation } from '../i18n/react-i18next-compat'
import type { AlertDialogState, AlertType, TransferMetadata, TransferProgress } from '../types/sender'

export interface UseReceiverReturn {
  ticket: string
  isReceiving: boolean
  isTransporting: boolean
  isCompleted: boolean
  savePath: string
  alertDialog: AlertDialogState
  transferMetadata: TransferMetadata | null
  transferProgress: TransferProgress | null
  fileNames: string[]
  
  handleTicketChange: (ticket: string) => void
  handleBrowseFolder: () => Promise<void>
  handleReceive: () => Promise<void>
  showAlert: (title: string, description: string, type?: AlertType) => void
  closeAlert: () => void
  resetForNewTransfer: () => Promise<void>
}

export function useReceiver(): UseReceiverReturn {
  const { t } = useTranslation()
  const [ticket, setTicket] = useState('')
  const [isReceiving, setIsReceiving] = useState(false)
  const [isTransporting, setIsTransporting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [savePath, setSavePath] = useState('')
  const [transferMetadata, setTransferMetadata] = useState<TransferMetadata | null>(null)
  const [transferProgress, setTransferProgress] = useState<TransferProgress | null>(null)
  const [transferStartTime, setTransferStartTime] = useState<number | null>(null)
  const [fileNames, setFileNames] = useState<string[]>([])
  
  const fileNamesRef = useRef<string[]>([])
  const transferProgressRef = useRef<TransferProgress | null>(null)
  const transferStartTimeRef = useRef<number | null>(null)
  const savePathRef = useRef<string>('')
  const folderOpenTriggeredRef = useRef(false)
  
  const isAbsolutePath = (path: string) => {
    if (!path) return false
    return path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path)
  }
  
  const normalizeSeparators = (path: string) => path.replace(/\\/g, '/')
  
  const resolveRevealPath = async (basePath: string, names: string[]) => {
    if (!basePath) return null
    
    if (names.length === 0) {
      return basePath
    }
    
    if (names.length === 1) {
      const [name] = names
      if (isAbsolutePath(name)) {
        return name
      }
      try {
        return await join(basePath, name)
      } catch (error) {
        console.error('Failed to join path for reveal:', error)
        return basePath
      }
    }
    
    const firstName = names[0]
    
    if (isAbsolutePath(firstName)) {
      const normalized = normalizeSeparators(firstName)
      const parts = normalized.split('/')
      if (parts.length > 1) {
        parts.pop()
        return parts.join('/') || firstName
      }
      return firstName
    }
    
    const normalized = normalizeSeparators(firstName)
    const [topLevel] = normalized.split('/')
    if (topLevel) {
      try {
        return await join(basePath, topLevel)
      } catch (error) {
        console.error('Failed to join directory path for reveal:', error)
      }
    }
    
    return basePath
  }
  
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

  useEffect(() => {
    const initializeSavePath = async () => {
      try {
        const downloadsPath = await downloadDir()
        setSavePath(downloadsPath)
      } catch (error) {
        console.error('Failed to get downloads directory:', error)
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
    let progressUpdateTimeout: NodeJS.Timeout | undefined

    const setupListeners = async () => {
      unlistenStart = await listen('receive-started', () => {
        setIsTransporting(true)
        setIsCompleted(false)
        setTransferStartTime(Date.now())
        setTransferProgress(null)
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

      unlistenFileNames = await listen('receive-file-names', (event: any) => {
        try {
          const payload = event.payload as string
          const names = JSON.parse(payload) as string[]
          
          setFileNames(names)
          fileNamesRef.current = names
        } catch (error) {
          console.error('Failed to parse file names event:', error)
        }
      })

      unlistenComplete = await listen('receive-completed', () => {
        if (progressUpdateTimeout) {
          clearTimeout(progressUpdateTimeout)
        }
        
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
          downloadPath: savePathRef.current
        }
        setTransferMetadata(metadata)
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
      showAlert(t('common:errors.folderDialogFailed'), `${t('common:errors.folderDialogFailedDesc')}: ${error}`, 'error')
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
      folderOpenTriggeredRef.current = false
      
      await invoke<string>('receive_file', { 
        ticket: ticket.trim(),
        outputPath: savePath
      })
    } catch (error) {
      console.error('Failed to receive file:', error)
      showAlert(t('common:errors.receiveFailed'), String(error), 'error')
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
    folderOpenTriggeredRef.current = false
  }

  useEffect(() => {
    if (!isCompleted) {
      folderOpenTriggeredRef.current = false
      return
    }
    if (!savePath || folderOpenTriggeredRef.current) {
      return
    }

    const revealDownloadFolder = async () => {
      try {
        folderOpenTriggeredRef.current = true
        const targetPath = await resolveRevealPath(savePath, fileNamesRef.current)
        if (targetPath) {
          await revealItemInDir(targetPath)
        }
      } catch (error) {
        console.error('Failed to open download folder:', error)
        showAlert(
          t('common:errors.openFolderFailed'),
          `${t('common:errors.openFolderFailedDesc')}: ${error}`,
          'error'
        )
      }
    }

    revealDownloadFolder()
  }, [isCompleted, savePath, showAlert, t])

  return {
    ticket,
    isReceiving,
    isTransporting,
    isCompleted,
    savePath,
    alertDialog,
    transferMetadata,
    transferProgress,
    fileNames,
    
    handleTicketChange,
    handleBrowseFolder,
    handleReceive,
    showAlert,
    closeAlert,
    resetForNewTransfer
  }
}
