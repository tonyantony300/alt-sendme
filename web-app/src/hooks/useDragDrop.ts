import { useState, useEffect } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import type { AlertDialogState, AlertType } from '../types/sender'

export interface UseDragDropReturn {
  // State
  isDragActive: boolean
  pathType: 'file' | 'directory' | null
  showFullPath: boolean
  alertDialog: AlertDialogState
  
  // Actions
  toggleFullPath: () => void
  browseFile: () => Promise<void>
  browseFolder: () => Promise<void>
  showAlert: (title: string, description: string, type?: AlertType) => void
  closeAlert: () => void
  checkPathType: (path: string) => Promise<void>
}

export function useDragDrop(onFileSelect: (path: string) => void): UseDragDropReturn {
  const [isDragActive, setIsDragActive] = useState(false)
  const [pathType, setPathType] = useState<'file' | 'directory' | null>(null)
  const [showFullPath, setShowFullPath] = useState(false)
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  })

  const checkPathType = async (path: string) => {
    try {
      const type = await invoke<string>('check_path_type', { path })
      setPathType(type as 'file' | 'directory')
    } catch (error) {
      console.error('Failed to check path type:', error)
      setPathType(null)
    }
  }

  const showAlert = (title: string, description: string, type: AlertType = 'info') => {
    setAlertDialog({ isOpen: true, title, description, type })
  }

  const closeAlert = () => {
    setAlertDialog(prev => ({ ...prev, isOpen: false }))
  }

  const toggleFullPath = () => {
    setShowFullPath(prev => !prev)
  }

  const browseFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
      })
      
      if (selected) {
        onFileSelect(selected)
      }
    } catch (error) {
      console.error('Failed to open file dialog:', error)
      showAlert('File Dialog Failed', `Failed to open file dialog: ${error}`, 'error')
    }
  }

  const browseFolder = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: true,
      })
      
      if (selected) {
        onFileSelect(selected)
      }
    } catch (error) {
      console.error('Failed to open folder dialog:', error)
      showAlert('Folder Dialog Failed', `Failed to open folder dialog: ${error}`, 'error')
    }
  }

  // Reset showFullPath when path changes
  useEffect(() => {
    setShowFullPath(false)
  }, [onFileSelect])

  // Listen for Tauri's file drop events
  useEffect(() => {
    const window = getCurrentWindow()
    
    let dropUnlisten: (() => void) | undefined
    let hoverUnlisten: (() => void) | undefined
    let cancelUnlisten: (() => void) | undefined

    // Listen for file drop
    window.listen<{ paths: string[], position: { x: number, y: number } }>('tauri://drag-drop', (event) => {
      setIsDragActive(false)
      
      if (event.payload?.paths && event.payload.paths.length > 0) {
        const path = event.payload.paths[0]
        onFileSelect(path)
      }
    }).then(unlisten => {
      dropUnlisten = unlisten
    }).catch(err => {
      console.error('Failed to register drag-drop listener:', err)
    })

    // Listen for drag hover
    window.listen('tauri://drag-hover', () => {
      setIsDragActive(true)
    }).then(unlisten => {
      hoverUnlisten = unlisten
    }).catch(err => {
      console.error('Failed to register drag-hover listener:', err)
    })

    // Listen for drag cancelled
    window.listen('tauri://drag-leave', () => {
      setIsDragActive(false)
    }).then(unlisten => {
      cancelUnlisten = unlisten
    }).catch(err => {
      console.error('Failed to register drag-leave listener:', err)
    })

    return () => {
      dropUnlisten?.()
      hoverUnlisten?.()
      cancelUnlisten?.()
    }
  }, [onFileSelect])

  return {
    // State
    isDragActive,
    pathType,
    showFullPath,
    alertDialog,
    
    // Actions
    toggleFullPath,
    browseFile,
    browseFolder,
    showAlert,
    closeAlert,
    checkPathType
  }
}
