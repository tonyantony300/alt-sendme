import { TicketInput } from './TicketInput'
import { InstructionsCard } from './InstructionsCard'
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

export function Receiver() {
  const {
    ticket,
    isReceiving,
    alertDialog,
    handleTicketChange,
    handleReceive,
    closeAlert
  } = useReceiver()


  return (
    <div className="p-6 space-y-6" style={{ color: 'var(--app-main-view-fg)' }}>
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
          onTicketChange={handleTicketChange}
          onReceive={handleReceive}
        />

        <InstructionsCard />
      </div>

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
