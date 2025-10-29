import { useState, useEffect, useRef } from 'react'
import { Copy, CheckCircle } from 'lucide-react'
import type { SharingControlsProps, TicketDisplayProps } from '../../types/sender'
import { TransferProgressBar } from './TransferProgressBar'

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Helper function to format file size without decimals
function formatFileSizeNoDecimals(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i]
}

// Format speed without decimals
function formatSpeedNoDecimals(speedBps: number): string {
  const mbps = speedBps / (1024 * 1024)
  const kbps = speedBps / 1024

  if (mbps >= 1) {
    return `${Math.round(mbps)} MB/s`
  } else {
    return `${Math.round(kbps)} KB/s`
  }
}

export function SharingActiveCard({ 
  selectedPath, 
  pathType,
  ticket, 
  copySuccess,
  transferProgress,
  isTransporting,
  isCompleted,
  onCopyTicket, 
  onStopSharing 
}: SharingControlsProps) {
  // Determine the current state and colors
  const getStatusColor = () => {
    if (isCompleted) return 'rgb(45, 120, 220)' // Blue - completed
    if (isTransporting) return 'rgba(37, 211, 101, 0.687)' // Green - transporting
    return '#B7B7B7' // Gray - listening
  }

  const getStatusText = () => {
    if (isCompleted) return 'Transfer completed'
    if (isTransporting) return 'Sharing in progress'
    return 'Listening for connection'
  }

  const statusColor = getStatusColor()
  const statusText = getStatusText()

  // Track cumulative transferred bytes for folders
  const [cumulativeBytesTransferred, setCumulativeBytesTransferred] = useState(0)
  const [transferStartTime, setTransferStartTime] = useState<number | null>(null)
  const previousBytesRef = useRef<number>(0)
  const maxBytesRef = useRef<number>(0)
  const isFolderTransfer = pathType === 'directory' && isTransporting

  // Reset cumulative bytes and track start time when transfer starts
  useEffect(() => {
    if (isTransporting && pathType === 'directory') {
      setCumulativeBytesTransferred(0)
      setTransferStartTime(Date.now())
      previousBytesRef.current = 0
      maxBytesRef.current = 0
    }
  }, [isTransporting, pathType])

  // Track cumulative bytes when transferring folders
  useEffect(() => {
    if (isFolderTransfer && transferProgress) {
      const currentBytes = transferProgress.bytesTransferred
      const previousBytes = previousBytesRef.current
      const maxBytes = maxBytesRef.current

      // Update max bytes seen for current file
      if (currentBytes > maxBytes) {
        maxBytesRef.current = currentBytes
      }

      // Detect file transition: if bytes decreased significantly, new file started
      // Add the max bytes from previous file to cumulative
      if (previousBytes > 0 && currentBytes < previousBytes * 0.5 && maxBytes > 0) {
        // Significant decrease (more than 50%) - likely new file started
        setCumulativeBytesTransferred(prev => prev + maxBytes)
        maxBytesRef.current = currentBytes
        previousBytesRef.current = currentBytes
      } else if (currentBytes === 0 && previousBytes > 0 && maxBytes > 0) {
        // Bytes reset to 0 - previous file completed
        setCumulativeBytesTransferred(prev => prev + maxBytes)
        maxBytesRef.current = 0
        previousBytesRef.current = 0
      } else if (currentBytes > previousBytes) {
        // Normal progress - just update previous
        previousBytesRef.current = currentBytes
      } else if (currentBytes < previousBytes && currentBytes >= previousBytes * 0.5) {
        // Small decrease but not significant - might be normal fluctuation, just update
        previousBytesRef.current = currentBytes
      }
    }
  }, [isFolderTransfer, transferProgress?.bytesTransferred])

  // Calculate total transferred bytes for display
  const totalTransferredBytes = isFolderTransfer && transferProgress
    ? cumulativeBytesTransferred + transferProgress.bytesTransferred
    : transferProgress?.bytesTransferred ?? 0

  // Calculate speed based on cumulative bytes and elapsed time for folder transfers
  const [calculatedSpeed, setCalculatedSpeed] = useState(0)
  
  useEffect(() => {
    if (isFolderTransfer && transferProgress && transferStartTime) {
      const updateSpeed = () => {
        const elapsed = (Date.now() - transferStartTime) / 1000.0 // Convert to seconds
        const speed = elapsed > 0 ? totalTransferredBytes / elapsed : 0
        setCalculatedSpeed(speed)
      }
      
      updateSpeed()
      const interval = setInterval(updateSpeed, 500) // Update every 500ms for smoother display
      return () => clearInterval(interval)
    } else if (transferProgress) {
      setCalculatedSpeed(transferProgress.speedBps)
    } else {
      setCalculatedSpeed(0)
    }
  }, [isFolderTransfer, transferProgress, transferStartTime, totalTransferredBytes])

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
        
      {/* Show ticket when not transferring, show progress bar when transferring */}
      {!isTransporting && ticket && (
        <TicketDisplay 
          ticket={ticket} 
          copySuccess={copySuccess} 
          onCopyTicket={onCopyTicket} 
        />
      )}
      
      {isTransporting && transferProgress && (
        pathType === 'directory' ? (
          // For folders: show message, speed, and transferred/total size
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Files are being transmitted
              </p>
              <p className="text-xs mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Speed: {formatSpeedNoDecimals(calculatedSpeed)}
              </p>
              <p 
                className="text-xs" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center'
                }}
              >
                <span className="font-mono inline-block" style={{ minWidth: '8ch', textAlign: 'right' }}>
                  {formatFileSizeNoDecimals(totalTransferredBytes)}
                </span>
                {' / '}
                <span className="font-mono inline-block" style={{ minWidth: '8ch', textAlign: 'right' }}>
                  {formatFileSize(transferProgress.totalBytes)}
                </span>
              </p>
            </div>
          </div>
        ) : (
          // For files: show progress bar
          <TransferProgressBar progress={transferProgress} />
        )
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
