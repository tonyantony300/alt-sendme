import type { AlertDialogState } from './ui'

export interface ReceiverState {
    ticket: string
    isReceiving: boolean
    alertDialog: AlertDialogState
}

export interface TicketInputProps {
    ticket: string
    isReceiving: boolean
    savePath: string
    onTicketChange: (ticket: string) => void
    onBrowseFolder: () => Promise<void>
    onReceive: () => Promise<void>
}
