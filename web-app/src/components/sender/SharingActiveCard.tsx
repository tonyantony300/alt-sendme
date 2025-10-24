import { Copy, CheckCircle } from 'lucide-react'
import type { SharingControlsProps, TicketDisplayProps } from '../../types/sender'
import { TransferProgressBar } from './TransferProgressBar'


export function SharingActiveCard({ 
  selectedPath, 
  ticket, 
  copySuccess,
  transferProgress,
  isImporting,
  importProgress,
  isTransporting,
  isCompleted,
  onCopyTicket, 
  onStopSharing 
}: SharingControlsProps) {
  // Determine the current state and colors
  const getStatusColor = () => {
    if (isCompleted) return 'rgb(45, 120, 220)' // Blue - completed
    if (isTransporting) return 'rgba(37, 211, 101, 0.687)' // Green - transporting
    if (isImporting) return 'rgba(255, 193, 7, 0.8)' // Orange - preparing
    return '#B7B7B7' // Gray - listening
  }

  const getStatusText = () => {
    if (isCompleted) return 'Transfer completed'
    if (isTransporting) return 'Sharing in progress'
    if (isImporting) return 'Preparing files...'
    return 'Listening for connection'
  }

  const statusColor = getStatusColor()
  const statusText = getStatusText()

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg absolute top-0 left-0"
      >
           <p className="text-xs mb-4 max-w-[30rem] truncate" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          <strong className="mr-1">File:</strong> {selectedPath?.split('/').pop()}
        </p>
        
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
          Keep this app open while others download your files
        </p>
        
      {/* Show import progress when preparing files */}
      {isImporting && importProgress && (
        <div className="space-y-2 p-3 rounded-md" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Preparing files: {importProgress.processed} / {importProgress.total}
          </p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${importProgress.percentage}%`,
                backgroundColor: 'rgba(255, 193, 7, 0.8)'
              }}
            />
          </div>
          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            This may take 20-30 seconds for large files...
          </p>
        </div>
      )}
        
      {/* Show ticket when not transferring and not importing, show progress bar when transferring */}
      {!isTransporting && !isImporting && ticket && (
        <TicketDisplay 
          ticket={ticket} 
          copySuccess={copySuccess} 
          onCopyTicket={onCopyTicket} 
        />
      )}
      
      {isTransporting && transferProgress && (
        <TransferProgressBar progress={transferProgress} />
      )}
       
    
      <button
        onClick={onStopSharing}
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

export function TicketDisplay({ ticket, copySuccess, onCopyTicket }: TicketDisplayProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium" style={{ color: 'var(--app-main-view-fg)' }}>
        Share this ticket:
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={ticket}
          readOnly
          className="flex-1 p-3 rounded-md text-xs font-mono"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'var(--app-main-view-fg)',
          }}
        />
        <button
          onClick={onCopyTicket}
          className="px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            backgroundColor: copySuccess ? 'var(--app-primary)' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: copySuccess ? 'var(--app-primary-fg)' : 'var(--app-main-view-fg)',
          }}
          title="Copy to clipboard"
        >
          {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
        Send this ticket to the person who wants to receive your file
      </p>
    </div>
  )
}
