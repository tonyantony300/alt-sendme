import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { DragDrop } from './DragDrop'
import { ShareActionCard } from './ShareActionCard'
import { SharingActiveCard } from './SharingActiveCard'
import { PulseAnimation } from './PulseAnimation'
import { TransferSuccessScreen } from './TransferSuccessScreen'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { useSender } from '../../hooks/useSender'
import { useTranslation } from '../../i18n/react-i18next-compat'

interface SenderProps {
  onTransferStateChange: (isSharing: boolean) => void
}

export function Sender({ onTransferStateChange }: SenderProps) {
  const {
    isSharing,
    isTransporting,
    isCompleted,
    ticket,
    selectedPath,
    pathType,
    isLoading,
    isStopping,
    copySuccess,
    alertDialog,
    transferMetadata,
    transferProgress,
    handleFileSelect,
    startSharing,
    stopSharing,
    copyTicket,
    closeAlert,
    resetForNewTransfer
  } = useSender()

  const { t } = useTranslation()

  useEffect(() => {
    onTransferStateChange(isSharing)
  }, [isSharing, onTransferStateChange])

  return (
    <div className="p-6 space-y-6 relative h-[28rem] overflow-y-auto flex flex-col" style={{ color: 'var(--app-main-view-fg)' }}>
   

      {!isSharing ? (
        <>
           <div className="text-center">
           <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
             {t('common:sender.title')}
           </h2>
           <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
           {t('common:sender.subtitle')}
           </p>
         </div>
        <div className="space-y-4 flex-1 flex flex-col">
          <DragDrop 
            onFileSelect={handleFileSelect} 
            selectedPath={selectedPath}
            isLoading={isLoading}
          />

          <ShareActionCard
            selectedPath={selectedPath}
            isLoading={isLoading}
            onFileSelect={handleFileSelect}
            onStartSharing={startSharing}
          />
        </div>
        </>
      ) : isStopping ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin" style={{ color: 'var(--app-accent-light)' }} />
          <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {t('common:sender.stoppingTransmission')}
          </p>
        </div>
      ) : isCompleted && transferMetadata && !isTransporting ? (
        <div className="flex-1 flex flex-col">
          <TransferSuccessScreen 
            metadata={transferMetadata}
            onDone={resetForNewTransfer}
          />
        </div>
      ) : (
        <>
        <div className="text-center">
        <PulseAnimation 
          isTransporting={isTransporting}
          isCompleted={isCompleted}
          className="mx-auto my-4 flex items-center justify-center" 
        />
        </div>
        <div className="flex-1 flex flex-col">
          <SharingActiveCard
            isSharing={isSharing}
            isLoading={isLoading}
            isTransporting={isTransporting}
            isCompleted={isCompleted}
            selectedPath={selectedPath}
            pathType={pathType}
            ticket={ticket}
            copySuccess={copySuccess}
            transferProgress={transferProgress}
            onStartSharing={startSharing}
            onStopSharing={stopSharing}
            onCopyTicket={copyTicket}
          />
        </div>
        </>
      )}

      <AlertDialog open={alertDialog.isOpen} onOpenChange={closeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={closeAlert}>
              {t('common:ok')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
