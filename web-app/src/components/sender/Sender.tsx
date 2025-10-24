import { useEffect } from 'react'
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
    isLoading,
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

  // Notify parent component when transfer state changes
  useEffect(() => {
    onTransferStateChange(isSharing)
  }, [isSharing, onTransferStateChange])

  return (
    <div className="p-6 space-y-6 relative max-h-[30rem] overflow-y-auto" style={{ color: 'var(--app-main-view-fg)' }}>
   

      {!isSharing ? (
        <>
           <div className="text-center">
           <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
             Send Files
           </h2>
           <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
           Connect devices directly & transfer data over the internet
           </p>
         </div>
        <div className="space-y-4">
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
      ) : isCompleted && transferMetadata ? (
        // Success screen - only show when transfer is completed AND metadata is available
        <TransferSuccessScreen 
          metadata={transferMetadata}
          onDone={resetForNewTransfer}
        />
      ) : (
        // Sharing active with pulse animation
        <>
        <div className="text-center">
        <PulseAnimation 
          isTransporting={isTransporting}
          isCompleted={isCompleted}
          className="mx-auto my-4 flex items-center justify-center" 
        />
        </div>
        <SharingActiveCard
          isSharing={isSharing}
          isLoading={isLoading}
          isTransporting={isTransporting}
          isCompleted={isCompleted}
          selectedPath={selectedPath}
          ticket={ticket}
          copySuccess={copySuccess}
          transferProgress={transferProgress}
          onStartSharing={startSharing}
          onStopSharing={stopSharing}
          onCopyTicket={copyTicket}
        />
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
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
