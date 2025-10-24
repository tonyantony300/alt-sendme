import type { TransferProgress, ExportProgress } from '../../types/sender'
import { TransferProgressBar } from '../sender/TransferProgressBar'
import { formatBytes } from '../../lib/utils'

interface ReceivingActiveCardProps {
  isReceiving: boolean
  isTransporting: boolean
  isExporting?: boolean
  isCompleted: boolean
  ticket: string
  transferProgress: TransferProgress | null
  exportProgress?: ExportProgress | null
  resumedFrom?: number | null
  fileNames: string[]
  onReceive: () => Promise<void>
  onStopReceiving: () => Promise<void>
}

export function ReceivingActiveCard({ 
  isTransporting,
  isExporting,
  isCompleted,
  transferProgress,
  exportProgress,
  resumedFrom,
  onStopReceiving 
}: ReceivingActiveCardProps) {
  // Determine the current state and colors
  const getStatusColor = () => {
    if (isCompleted) return 'rgb(45, 120, 220)' // Blue - completed
    if (isExporting) return 'rgba(255, 193, 7, 0.8)' // Orange - saving
    if (isTransporting) return 'rgba(37, 211, 101, 0.687)' // Green - transporting
    return '#B7B7B7' // Gray - connecting
  }

  const getStatusText = () => {
    if (isCompleted) return 'Download completed'
    if (isExporting) return 'Saving files...'
    if (isTransporting) return 'Downloading in progress'
    return 'Connecting to sender'
  }


  const statusColor = getStatusColor()
  const statusText = getStatusText()

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg absolute top-0 left-0">
       
        <div className="flex items-center mb-2">
          <div 
            className="h-2 w-2 rounded-full mr-2" 
            style={{ backgroundColor: statusColor }}
          ></div>
          <p 
            className="text-sm font-medium" 
            style={{ color: statusColor }}
          >
            {statusText}
          </p>
        </div>
      </div>
      
      <p className="text-xs text-center" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        Keep this app open while downloading files
      </p>
      
      {/* Show resume notification if download resumed */}
      {resumedFrom && resumedFrom > 0 && (
        <div 
          className="p-3 rounded-md border"
          style={{
            backgroundColor: 'rgba(37, 211, 101, 0.1)',
            borderColor: 'rgba(37, 211, 101, 0.3)',
            color: 'rgba(37, 211, 101, 1)'
          }}
        >
          <p className="text-sm font-medium">
            🔄 Resuming download from {formatBytes(resumedFrom)}
          </p>
          <p className="text-xs opacity-80">
            Previous progress saved - continuing where you left off
          </p>
        </div>
      )}
        
      {/* Show export progress when saving files */}
      {isExporting && exportProgress && (
        <div className="space-y-2 p-3 rounded-md" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Saving files: {exportProgress.current} / {exportProgress.total}
          </p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${exportProgress.percentage}%`,
                backgroundColor: 'rgba(255, 193, 7, 0.8)'
              }}
            />
          </div>
          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Copying files to destination folder...
          </p>
        </div>
      )}
        
      {/* Show progress bar when transporting */}
      {isTransporting && !isExporting && transferProgress && (
        <TransferProgressBar progress={transferProgress} />
      )}
       
      <button
        onClick={onStopReceiving}
        className="absolute top-0 right-6 py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center"
        style={{
          backgroundColor: 'var(--app-destructive)',
          color: 'var(--app-destructive-fg)',
        }}
      >
        <span className="text-xl"> ⏹</span>
      </button>
    </div>
  )
}