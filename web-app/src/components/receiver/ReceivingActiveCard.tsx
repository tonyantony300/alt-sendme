import type { TransferProgress } from '../../types/sender'
import { TransferProgressBar } from '../sender/TransferProgressBar'

interface ReceivingActiveCardProps {
  isReceiving: boolean
  isTransporting: boolean
  isCompleted: boolean
  ticket: string
  transferProgress: TransferProgress | null
  fileNames: string[]
  onReceive: () => Promise<void>
  onStopReceiving: () => Promise<void>
}

export function ReceivingActiveCard({ 
  isTransporting,
  isCompleted,
  transferProgress,
  onStopReceiving 
}: ReceivingActiveCardProps) {
  // Determine the current state and colors
  const getStatusColor = () => {
    if (isCompleted) return 'rgb(45, 120, 220)' // Blue - completed
    if (isTransporting) return 'rgba(37, 211, 101, 0.687)' // Green - transporting
    return '#B7B7B7' // Gray - connecting
  }

  const getStatusText = () => {
    if (isCompleted) return 'Download completed'
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
        
      {/* Show progress bar when transporting */}
      {isTransporting && transferProgress && (
        <TransferProgressBar progress={transferProgress} />
      )}
       
      <button
        onClick={onStopReceiving}
        className="absolute top-0 right-6 py-2 px-4 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center"
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