import { useEffect } from 'react'
import { TicketInput } from './TicketInput'
import { InstructionsCard } from './InstructionsCard'
import { ReceivingActiveCard } from './ReceivingActiveCard'
import { PulseAnimation } from '../sender/PulseAnimation'
import { TransferSuccessScreen } from '../sender/TransferSuccessScreen'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { useReceiver } from '../../hooks/useReceiver'

interface ReceiverProps {
  onTransferStateChange: (isReceiving: boolean) => void
}

export function Receiver({ onTransferStateChange }: ReceiverProps) {
  const {
    ticket,
    isReceiving,
    isTransporting,
    isCompleted,
    savePath,
    alertDialog,
    transferMetadata,
    transferProgress,
    fileNames,
    handleTicketChange,
    handleBrowseFolder,
    handleReceive,
    closeAlert,
    resetForNewTransfer
  } = useReceiver()

  // Notify parent component when transfer state changes
  useEffect(() => {
    onTransferStateChange(isReceiving)
  }, [isReceiving, onTransferStateChange])

  return (
    <div className="p-6 space-y-6 relative" style={{ color: 'var(--app-main-view-fg)' }}>

      {!isReceiving ? (
        <>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
              Receive Files
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Download files shared by others
            </p>
          </div>

          <div className="space-y-4">
            <TicketInput
              ticket={ticket}
              isReceiving={isReceiving}
              savePath={savePath}
              onTicketChange={handleTicketChange}
              onBrowseFolder={handleBrowseFolder}
              onReceive={handleReceive}
            />

            <InstructionsCard />
          </div>
        </>
      ) : isCompleted && transferMetadata ? (
        // Success screen - only show when transfer is completed AND metadata is available
        <TransferSuccessScreen 
          metadata={transferMetadata}
          onDone={resetForNewTransfer}
        />
      ) : (
        // Receiving active with pulse animation
        <>
          <div className="text-center">
            <PulseAnimation 
              isTransporting={isTransporting}
              isCompleted={isCompleted}
              className="mx-auto mb-4 flex items-center justify-center" 
            />
          </div>
          <ReceivingActiveCard
            isReceiving={isReceiving}
            isTransporting={isTransporting}
            isCompleted={isCompleted}
            ticket={ticket}
            transferProgress={transferProgress}
            fileNames={fileNames}
            onReceive={handleReceive}
            onStopReceiving={resetForNewTransfer}
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
