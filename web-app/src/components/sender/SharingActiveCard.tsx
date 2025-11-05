import { useState, useEffect, useRef } from 'react'
import { Copy, CheckCircle, Square } from 'lucide-react'
import type { SharingControlsProps, TicketDisplayProps } from '../../types/sender'
import { TransferProgressBar } from './TransferProgressBar'
import { useTranslation } from '../../i18n/react-i18next-compat'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatFileSizeNoDecimals(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i]
}

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
  const { t } = useTranslation()
  
  const getStatusColor = () => {
    if (isCompleted) return 'rgb(45, 120, 220)'
    if (isTransporting) return 'rgba(37, 211, 101, 0.687)'
    return '#B7B7B7'
  }

  const getStatusText = () => {
    if (isCompleted) return t('common:sender.transferCompleted')
    if (isTransporting) return t('common:sender.sharingInProgress')
    return t('common:sender.listeningForConnection')
  }

  const statusColor = getStatusColor()
  const statusText = getStatusText()

  const [cumulativeBytesTransferred, setCumulativeBytesTransferred] = useState(0)
  const [transferStartTime, setTransferStartTime] = useState<number | null>(null)
  const previousBytesRef = useRef<number>(0)
  const maxBytesRef = useRef<number>(0)
  const isFolderTransfer = pathType === 'directory' && isTransporting

  useEffect(() => {
    if (isTransporting && pathType === 'directory') {
      setCumulativeBytesTransferred(0)
      setTransferStartTime(Date.now())
      previousBytesRef.current = 0
      maxBytesRef.current = 0
    }
  }, [isTransporting, pathType])

  useEffect(() => {
    if (isFolderTransfer && transferProgress) {
      const currentBytes = transferProgress.bytesTransferred
      const previousBytes = previousBytesRef.current
      const maxBytes = maxBytesRef.current

      if (currentBytes > maxBytes) {
        maxBytesRef.current = currentBytes
      }

      if (previousBytes > 0 && currentBytes < previousBytes * 0.5 && maxBytes > 0) {
        setCumulativeBytesTransferred(prev => prev + maxBytes)
        maxBytesRef.current = currentBytes
        previousBytesRef.current = currentBytes
      } else if (currentBytes === 0 && previousBytes > 0 && maxBytes > 0) {
        setCumulativeBytesTransferred(prev => prev + maxBytes)
        maxBytesRef.current = 0
        previousBytesRef.current = 0
      } else if (currentBytes > previousBytes) {
        previousBytesRef.current = currentBytes
      } else if (currentBytes < previousBytes && currentBytes >= previousBytes * 0.5) {
        previousBytesRef.current = currentBytes
      }
    }
  }, [isFolderTransfer, transferProgress?.bytesTransferred])

  const totalTransferredBytes = isFolderTransfer && transferProgress
    ? cumulativeBytesTransferred + transferProgress.bytesTransferred
    : transferProgress?.bytesTransferred ?? 0

  const [calculatedSpeed, setCalculatedSpeed] = useState(0)
  
  useEffect(() => {
    if (isFolderTransfer && transferProgress && transferStartTime) {
      const updateSpeed = () => {
        const elapsed = (Date.now() - transferStartTime) / 1000.0
        const speed = elapsed > 0 ? totalTransferredBytes / elapsed : 0
        setCalculatedSpeed(speed)
      }
      
      updateSpeed()
      const interval = setInterval(updateSpeed, 500)
      return () => clearInterval(interval)
    } else if (transferProgress) {
      setCalculatedSpeed(transferProgress.speedBps)
    } else {
      setCalculatedSpeed(0)
    }
  }, [isFolderTransfer, transferProgress, transferStartTime, totalTransferredBytes])

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg absolute top-0 left-0">
           <p className="text-xs mb-4 max-w-[30rem] truncate" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          <strong className="mr-1">{t('common:sender.fileLabel')}</strong> {selectedPath?.split('/').pop()}
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
          {t('common:sender.keepAppOpen')}
        </p>
        
      {!isTransporting && ticket && (
        <TicketDisplay 
          ticket={ticket} 
          copySuccess={copySuccess} 
          onCopyTicket={onCopyTicket} 
        />
      )}
      
      {isTransporting && transferProgress && (
        pathType === 'directory' ? (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {t('common:sender.filesBeingTransmitted')}
              </p>
              <p className="text-xs mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {t('common:transfer.speed')}: {formatSpeedNoDecimals(calculatedSpeed)}
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
          <TransferProgressBar progress={transferProgress} />
        )
      )}
       
    
      <button
        onClick={onStopSharing}
        className="absolute top-0 right-6 w-10 h-10 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center p-0"
        style={{
          backgroundColor: 'var(--app-destructive)',
          color: 'var(--app-destructive-fg)',
        }}
        aria-label="Stop sharing"
      >
        <Square className="w-4 h-4" fill="currentColor" />
      </button>
    </div>
  )
}

export function TicketDisplay({ ticket, copySuccess, onCopyTicket }: TicketDisplayProps) {
  const { t } = useTranslation()
  
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium" style={{ color: 'var(--app-main-view-fg)' }}>
        {t('common:sender.shareThisTicket')}
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
          title={t('common:sender.copyToClipboard')}
        >
          {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
        {t('common:sender.sendThisTicket')}
      </p>
    </div>
  )
}
