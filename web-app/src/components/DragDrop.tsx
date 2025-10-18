import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { open } from '@tauri-apps/plugin-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { Upload, FileText, AlertCircle } from 'lucide-react'

interface DragDropProps {
  onFileSelect: (path: string) => void
  selectedPath?: string | null
  isLoading?: boolean
}

export function DragDrop({ onFileSelect, selectedPath, isLoading }: DragDropProps) {
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

  const onDrop = useCallback((_acceptedFiles: File[]) => {
    // For Tauri, we need to handle file paths differently
    // The drag and drop will need to be handled by the Tauri backend
    // For now, we'll just show a message
    showAlert('Drag & Drop Not Implemented', 'Drag and drop is not yet implemented. Please use the browse button.', 'info')
  }, [showAlert])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true, // Disable click to open file dialog
    noKeyboard: true,
  })

  const getDropzoneStyles = () => {
    const baseStyles = {
      border: '2px dashed',
      borderRadius: 'var(--radius-lg)',
      padding: '2rem',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: 'var(--app-main-view)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: 'var(--app-main-view-fg)',
    }

    if (isDragReject) {
      return {
        ...baseStyles,
        borderColor: 'var(--app-destructive)',
        backgroundColor: 'rgba(144, 60, 60, 0.1)',
      }
    }

    if (isDragActive) {
      return {
        ...baseStyles,
        borderColor: 'var(--app-accent)',
        backgroundColor: 'rgba(45, 120, 220, 0.1)',
      }
    }

    if (selectedPath) {
      return {
        ...baseStyles,
        borderColor: 'var(--app-primary)',
        backgroundColor: 'rgba(219, 88, 44, 0.1)',
      }
    }

    return baseStyles
  }

  return (
    <div {...getRootProps()} style={getDropzoneStyles()}>
      <input {...getInputProps()} />
      
      <div className="space-y-4">
        <div className="flex justify-center">
          {isDragReject ? (
            <AlertCircle className="h-12 w-12" style={{ color: 'var(--app-destructive)' }} />
          ) : selectedPath ? (
            <FileText className="h-12 w-12" style={{ color: 'var(--app-primary)' }} />
          ) : (
            <Upload className="h-12 w-12" style={{ 
              color: isDragActive ? 'var(--app-accent)' : 'rgba(255, 255, 255, 0.6)' 
            }} />
          )}
        </div>
        
        <div>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
            {isDragReject 
              ? 'Invalid file type' 
              : isDragActive 
                ? 'Drop files or folders here' 
                : selectedPath 
                  ? 'File selected' 
                  : 'Drag & drop files or folders here'
            }
          </p>
          <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {selectedPath 
              ? `Selected: ${selectedPath.split('/').pop()}` 
              : 'or browse to select files or folders'
            }
          </p>
        </div>

        {!selectedPath && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Let user choose between file and folder
              const choice = confirm('Select a file or folder?\n\nOK = File\nCancel = Folder')
              if (choice) {
                openFileDialog()
              } else {
                openFolderDialog()
              }
            }}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--app-accent)',
              color: 'var(--app-accent-fg)',
              border: '1px solid var(--app-accent)',
            }}
          >
           
            {isLoading ? 'Loading...' : 'Browse'}
          </button>
        )}
      </div>

      <AlertDialog open={alertDialog.isOpen} onOpenChange={(open) => setAlertDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
