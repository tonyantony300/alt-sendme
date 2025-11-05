import { Square } from 'lucide-react'
import type { TransferProgress } from '../../types/sender'
import { TransferProgressBar } from '../sender/TransferProgressBar'
import { useTranslation } from '../../i18n/react-i18next-compat'

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
  const { t } = useTranslation()
  
  const getStatusColor = () => {
    if (isCompleted) return 'rgb(45, 120, 220)'
    if (isTransporting) return 'rgba(37, 211, 101, 0.687)'
    return '#B7B7B7'
  }

  const getStatusText = () => {
    if (isCompleted) return t('common:receiver.downloadCompleted')
    if (isTransporting) return t('common:receiver.downloadingInProgress')
    return t('common:receiver.connectingToSender')
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
        {t('common:receiver.keepAppOpen')}
      </p>
        
      {isTransporting && transferProgress && (
        <TransferProgressBar progress={transferProgress} />
      )}
       
      <button
        onClick={onStopReceiving}
        className="absolute top-0 right-6 w-10 h-10 rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center p-0"
        style={{
          backgroundColor: 'var(--app-destructive)',
          color: 'var(--app-destructive-fg)',
        }}
        aria-label="Stop receiving"
      >
        <Square className="w-4 h-4" fill="currentColor" />
      </button>
    </div>
  )
}