import { useState, useEffect } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { Upload, CheckCircle, ChevronRight, ChevronDown } from 'lucide-react'

interface DragDropProps {
  onFileSelect: (path: string) => void
  selectedPath?: string | null
  isLoading?: boolean
}

export function DragDrop({ onFileSelect, selectedPath, isLoading }: DragDropProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [pathType, setPathType] = useState<'file' | 'directory' | null>(null)
  const [showFullPath, setShowFullPath] = useState(false)
  
  // Reset showFullPath when selectedPath changes
  useEffect(() => {
    setShowFullPath(false)
  }, [selectedPath])
  
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    type: 'success' | 'error' | 'info'
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'info'
  })

  const showAlert = (title: string, description: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertDialog({ isOpen: true, title, description, type })
  }

  const closeAlert = () => {
    setAlertDialog(prev => ({ ...prev, isOpen: false }))
  }

  const checkPathType = async (path: string) => {
    try {
      const type = await invoke<string>('check_path_type', { path })
      setPathType(type as 'file' | 'directory')
    } catch (error) {
      console.error('Failed to check path type:', error)
      setPathType(null)
    }
  }

  // Check path type when selectedPath changes
  useEffect(() => {
    if (selectedPath) {
      checkPathType(selectedPath)
    } else {
      setPathType(null)
    }
  }, [selectedPath])

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

  const openFileDialog = async () => {
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

  const openFolderDialog = async () => {
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

  const getDropzoneStyles = () => {
    const baseStyles = {
      border: '2px dashed',
      borderRadius: 'var(--radius-lg)',
      padding: '2rem 2rem 1rem 2rem',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: 'var(--app-main-view)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: 'var(--app-main-view-fg)',
    }

    if (isDragActive) {
      return {
        ...baseStyles,
        borderColor: 'var(--app-accent)',
        backgroundColor: 'rgba(45, 120, 220, 0.1)',
      }
    }


    return baseStyles
  }

  return (
    <div style={getDropzoneStyles()}>
      
      <div className="space-y-4">
        <div className="flex justify-center">
          {selectedPath ? (
            <CheckCircle className="h-12 w-12" style={{ color: 'var(--app-primary)' }} />
          ) : (
            <Upload className="h-12 w-12" style={{ 
              color: isDragActive ? 'var(--app-accent)' : 'rgba(255, 255, 255, 0.6)' 
            }} />
          )}
        </div>
        
        <div>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
            {isDragActive 
              ? 'Drop files or folders here' 
              : selectedPath 
                ? pathType === 'directory' 
                  ? 'Folder selected' 
                  : pathType === 'file'
                    ? 'File selected'
                    : 'Item selected'
                : 'Drag & drop files or folders here'
            }
          </p>
          <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {selectedPath 
              ? (
                <div>
                  <div 
                    className="font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                    onClick={() => setShowFullPath(!showFullPath)}
                    title="Click to toggle full path"
                  >
                    {selectedPath.split('/').pop()}
                    <span className="-mr-2">
                      {showFullPath ? (
                        <ChevronDown className="p-0.5 h-6 w-6" size={16} />
                      ) : (
                        <ChevronRight className="p-0.5 h-6 w-6" size={16} />
                      )}
                    </span>
                  </div>
                  <div 
                    className="text-xs mt-1 opacity-75 break-all transition-opacity"
                    style={{ 
                      visibility: showFullPath ? 'visible' : 'hidden',
                    
                    }}
                  >
                    {selectedPath}
                  </div>
                </div>
              )
              : 'or browse to select files or folders'
            }
          </p>
        </div>

        {!selectedPath && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                openFileDialog()
              }}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--app-accent)',
                color: 'var(--app-accent-fg)',
                border: '1px solid var(--app-accent)',
              }}
            >
              {isLoading ? 'Loading...' : 'Browse File'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                openFolderDialog()
              }}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--app-accent)',
                color: 'var(--app-accent-fg)',
                border: '1px solid var(--app-accent)',
              }}
            >
              {isLoading ? 'Loading...' : 'Browse Folder'}
            </button>
          </div>
        )}
      </div>

      <AlertDialog open={alertDialog.isOpen} onOpenChange={closeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={closeAlert}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
