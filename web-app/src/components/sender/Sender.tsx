import { DragDrop } from './DragDrop'
import { ShareActionCard } from './ShareActionCard'
import { SharingActiveCard } from './SharingActiveCard'
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
    ticket,
    selectedPath,
    isLoading,
    copySuccess,
    alertDialog,
    handleFileSelect,
    startSharing,
    stopSharing,
    copyTicket,
    closeAlert
  } = useSender()

  return (
    <div className="p-6 space-y-6" style={{ color: 'var(--app-main-view-fg)' }}>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
          Send Files
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Share files with others the peer to peer way
        </p>
      </div>

      {!isSharing ? (
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
      ) : (
        <SharingActiveCard
          isSharing={isSharing}
          isLoading={isLoading}
          selectedPath={selectedPath}
          ticket={ticket}
          copySuccess={copySuccess}
          onStartSharing={startSharing}
          onStopSharing={stopSharing}
          onCopyTicket={copyTicket}
        />
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
