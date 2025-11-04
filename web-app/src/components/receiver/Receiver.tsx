import { useEffect, useState } from 'react'
import { TicketInput } from './TicketInput'
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
import { Info } from 'lucide-react'

interface ReceiverProps {
  onTransferStateChange: (isReceiving: boolean) => void
}

export function Receiver({ onTransferStateChange }: ReceiverProps) {
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false)
  
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

  useEffect(() => {
    onTransferStateChange(isReceiving)
  }, [isReceiving, onTransferStateChange])

  return (
    <div className="p-6 space-y-6 relative h-[28rem] overflow-y-auto flex flex-col" style={{ color: 'var(--app-main-view-fg)' }}>

      {!isReceiving ? (
        <>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--app-main-view-fg)' }}>
                Receive Files
              </h2>
              <button
                onClick={() => setShowInstructionsDialog(true)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors absolute top-6 right-6"
                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                <Info size={24} />
              </button>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Download files from sender using encrypted peer-to-peer connections over the internet.
            </p>
          </div>

          <div className="space-y-4 flex-1 flex flex-col">
            <TicketInput
              ticket={ticket}
              isReceiving={isReceiving}
              savePath={savePath}
              onTicketChange={handleTicketChange}
              onBrowseFolder={handleBrowseFolder}
              onReceive={handleReceive}
            />
          </div>
        </>
      ) : isCompleted && transferMetadata ? (
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
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>How to receive files</AlertDialogTitle>
            <AlertDialogDescription>
           
            </AlertDialogDescription>
            <ol className="text-sm space-y-2 list-decimal list-inside mt-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              <li>Sender must be online and sharing a file</li>
              <li>Get a ticket from the sender</li>
              <li>Paste the ticket in the text area</li>
              <li>Click download to start receiving</li>
              <li>Files will be saved to your selected folder</li>
            </ol>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInstructionsDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
