import type { AlertDialogState } from './ui'
import type { TicketPreviewMetadata } from './transfer'

export interface ReceiverState {
	ticket: string
	isReceiving: boolean
	alertDialog: AlertDialogState
}

export interface TicketInputProps {
	ticket: string
	isReceiving: boolean
	savePath: string
	previewMetadata: TicketPreviewMetadata | null
	isPreviewLoading: boolean
	onTicketChange: (ticket: string) => void
	onBrowseFolder: () => Promise<void>
	onReceive: () => Promise<void>
}
