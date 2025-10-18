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

export function Sender() {
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
    handleFileSelect,
    startSharing,
    stopSharing,
    copyTicket,
    closeAlert,
    resetForNewTransfer
  } = useSender()

  // Debug logging
  console.log('🎨 Sender render state:', {
    isSharing,
    isTransporting,
    isCompleted,
    transferMetadata: transferMetadata ? 'present' : 'null',
    selectedPath
  })

  return (
    <div className="p-6 space-y-6 relative" style={{ color: 'var(--app-main-view-fg)' }}>
   

      {!isSharing ? (
        <>
           <div className="text-center">
           <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
             Send Files
           </h2>
           <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
             Share files with others the peer to peer way
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
      ) : transferMetadata ? (
        // Success screen
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
          className="mx-auto mb-4 flex items-center justify-center" 
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
