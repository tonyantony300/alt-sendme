import { Upload, CheckCircle, ChevronRight, ChevronDown, Loader2 } from 'lucide-react'
import type { DropzoneProps } from '../../types/sender'

export function Dropzone({ 
  isDragActive, 
  selectedPath, 
  pathType, 
  showFullPath, 
  isLoading, 
  onToggleFullPath 
}: DropzoneProps) {
  const getDropzoneStyles = () => {
    const baseStyles = {
      border: '2px dashed',
      borderRadius: 'var(--radius-lg)',
      padding: '4rem',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'border-color 0.2s ease, background-color 0.2s ease',
      backgroundColor: 'var(--app-main-view)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: 'var(--app-main-view-fg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '12rem',
    }

    if (isDragActive) {
      return {
        ...baseStyles,
        borderColor: 'var(--app-accent)',
        backgroundColor: 'rgba(45, 120, 220, 0.1)',
      }
    }

    if (selectedPath && !isLoading) {
      return {
        ...baseStyles,
        paddingBottom: '2rem',
      }
    }

    if (isLoading) {
      return {
        ...baseStyles,
        paddingBottom: '4rem',
      }
    }


    return baseStyles
  }

  const getStatusText = () => {
    if (isLoading) return 'Preparing for transport...'
    if (isDragActive) return 'Drop files or folders here'
    if (selectedPath) {
      if (pathType === 'directory') return 'Folder selected'
      if (pathType === 'file') return 'File selected'
      return 'Item selected'
    }
    return 'Drag & drop'
  }

  const getSubText = () => {
    if (isLoading) return 'Please wait while we process your files for sharing...'
    if (selectedPath) {
      return (
        <div>
          <div 
            className="font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
            onClick={onToggleFullPath}
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
    }
    return 'or browse to select files or folders'
  }

  return (
    <div style={getDropzoneStyles()}>
      <div className="space-y-4 w-full">
        <div className="flex justify-center">
          {isLoading ? (
            <Loader2 className="h-12 w-12 animate-spin" style={{ color: 'var(--app-accent-light)' }} />
          ) : selectedPath ? (
            <CheckCircle className="h-12 w-12" style={{ color: 'var(--app-primary)' }} />
          ) : (
            <Upload className="h-12 w-12" style={{ 
              color: isDragActive ? 'var(--app-accent-light)' : 'rgba(255, 255, 255, 0.6)' 
            }} />
          )}
        </div>
        
        <div>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
            {getStatusText()}
          </p>
          <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {getSubText()}
          </div>
        </div>
      </div>
    </div>
  )
}
