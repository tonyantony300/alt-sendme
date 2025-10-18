import { CheckCircle } from 'lucide-react'
import type { SuccessScreenProps } from '../../types/sender'

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Helper function to format duration
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(1)
    return `${minutes}m ${seconds}s`
  }
}

export function TransferSuccessScreen({ metadata, onDone }: SuccessScreenProps) {
  console.log('🎉 TransferSuccessScreen rendered with metadata:', metadata)
  
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      {/* Success Icon */}
      <div className="flex items-center justify-center">
        <CheckCircle 
          size={32} 
          className="text-green-500"
          style={{ color: 'rgba(37, 211, 101, 1)' }}
        />
      </div>
      
      {/* Success Message */}
      <div className="text-center">
        <h2 
          className="text-2xl font-semibold mb-2"
          style={{ color: 'var(--app-main-view-fg)' }}
        >
          Transfer Complete!
        </h2>
        <p 
          className="text-sm"
          style={{ color: 'rgba(255, 255, 255, 0.6)' }}
        >
          Your file has been successfully shared
        </p>
      </div>
      
      {/* Transfer Metadata */}
      <div 
        className="bg-opacity-10 rounded-lg p-4 w-full max-w-sm"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span 
              className="text-sm font-medium"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              File:
            </span>
            <span 
              className="text-sm truncate max-w-[200px]"
              style={{ color: 'var(--app-main-view-fg)' }}
              title={metadata.fileName}
            >
              {metadata.fileName}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span 
              className="text-sm font-medium"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Size:
            </span>
            <span 
              className="text-sm"
              style={{ color: 'var(--app-main-view-fg)' }}
            >
              {formatFileSize(metadata.fileSize)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span 
              className="text-sm font-medium"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Duration:
            </span>
            <span 
              className="text-sm"
              style={{ color: 'var(--app-main-view-fg)' }}
            >
              {formatDuration(metadata.duration)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Done Button */}
      <button
        onClick={onDone}
        className="w-full max-w-sm py-3 px-6 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: 'var(--app-primary)',
          color: 'var(--app-primary-fg)',
        }}
      >
        Done
      </button>
    </div>
  )
}
