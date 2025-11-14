import { CheckCircle, XCircle } from 'lucide-react'
import type { SuccessScreenProps } from '../../types/sender'
import { trackTransferComplete } from '../../lib/analytics'
import { useTranslation } from '../../i18n/react-i18next-compat'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return 'NA'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

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

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return 'NA'
  
  const mbps = bytesPerSecond / (1024 * 1024)
  const kbps = bytesPerSecond / 1024

  if (mbps >= 1) {
    return `${mbps.toFixed(2)} MB/s`
  } else {
    return `${kbps.toFixed(2)} KB/s`
  }
}

function calculateAverageSpeed(fileSizeBytes: number, durationMs: number): number {
  if (durationMs === 0) return 0
  const durationSeconds = durationMs / 1000
  return fileSizeBytes / durationSeconds
}

export function TransferSuccessScreen({ metadata, onDone }: SuccessScreenProps) {
  const wasStopped = metadata.wasStopped || false
  const isReceiver = !!metadata.downloadPath
  const { t } = useTranslation()
  
  const handleDone = () => {
    if (!wasStopped && !isReceiver) {
      trackTransferComplete(metadata.fileSize, 'sender', metadata.duration)
    }
    onDone()
  }
  
  return (
    <div className="flex flex-col items-center justify-center space-y-6 ">
      <div className="flex items-center justify-center">
        {wasStopped ? (
          <XCircle 
            size={44} 
            style={{ color: 'rgba(239, 68, 68, 1)' }}
          />
        ) : (
          <CheckCircle 
            size={44} 
            className="text-green-500"
            style={{ color: 'rgba(37, 211, 101, 1)' }}
          />
        )}
      </div>
      
      <div className="text-center">
        <h2 
          className="text-2xl font-semibold mb-2"
          style={{ color: 'var(--app-main-view-fg)' }}
        >
          {wasStopped ? t('common:transfer.stopped') : t('common:transfer.complete')}
        </h2>
        <p 
          className="text-sm"
          style={{ color: 'rgba(255, 255, 255, 0.6)' }}
        >
          {wasStopped ? t('common:transfer.wasStopped') : t('common:transfer.successMessage')}
        </p>
      </div>
      
      <div 
        className="bg-opacity-10 rounded-lg p-4 w-full max-w-full"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span 
              className="text-sm font-medium mr-2"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {t('common:transfer.fileName')}:
            </span>
            <span 
              className="text-sm truncate max-w-full"
              style={{ color: 'var(--app-main-view-fg)' }}
              title={metadata.fileName}
            >
              {metadata.fileName}
            </span>
          </div>
          
          {metadata.downloadPath && (
            <div className="flex justify-between items-center">
              <span 
                className="text-sm font-medium mr-2"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                {t('common:transfer.downloadPath')}:
              </span>
              <span 
                className="text-sm truncate max-w-full"
                style={{ color: 'var(--app-main-view-fg)' }}
                title={metadata.downloadPath}
              >
                {metadata.downloadPath}
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span 
              className="text-sm font-medium mr-2"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {t('common:transfer.fileSize')}:
            </span>
            <span 
              className="text-sm"
              style={{ color: 'var(--app-main-view-fg)' }}
            >
              {wasStopped ? 'NA' : formatFileSize(metadata.fileSize)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span 
              className="text-sm font-medium mr-2"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {t('common:transfer.duration')}:
            </span>
            <span 
              className="text-sm"
              style={{ color: 'var(--app-main-view-fg)' }}
            >
              {wasStopped ? '0ms' : formatDuration(metadata.duration)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span 
              className="text-sm font-medium mr-2"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {t('common:transfer.avgSpeed')}:
            </span>
            <span 
              className="text-sm"
              style={{ color: 'var(--app-main-view-fg)' }}
            >
              {wasStopped ? 'NA' : formatSpeed(calculateAverageSpeed(metadata.fileSize, metadata.duration))}
            </span>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleDone}
        className="w-full max-w-sm py-3 px-6 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: 'var(--app-primary)',
          color: 'var(--app-primary-fg)',
        }}
      >
        {t('common:transfer.done')}
      </button>
    </div>
  )
}
