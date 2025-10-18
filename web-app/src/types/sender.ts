export interface AlertDialogState {
  isOpen: boolean
  title: string
  description: string
  type: 'success' | 'error' | 'info'
}

export interface SharingState {
  isSharing: boolean
  ticket: string | null
  selectedPath: string | null
  isLoading: boolean
}

export interface CopyState {
  copySuccess: boolean
}

export interface SenderState extends SharingState, CopyState {
  alertDialog: AlertDialogState
}

export type AlertType = 'success' | 'error' | 'info'

export interface ShareActionProps {
  selectedPath: string | null
  isLoading: boolean
  onFileSelect: (path: string) => void
}

export interface SharingControlsProps {
  isSharing: boolean
  isLoading: boolean
  selectedPath: string | null
  ticket: string | null
  copySuccess: boolean
  onStartSharing: () => Promise<void>
  onStopSharing: () => Promise<void>
  onCopyTicket: () => Promise<void>
}

export interface TicketDisplayProps {
  ticket: string
  copySuccess: boolean
  onCopyTicket: () => Promise<void>
}

// Receiver types
export interface ReceiverState {
  ticket: string
  isReceiving: boolean
  alertDialog: AlertDialogState
}

export interface TicketInputProps {
  ticket: string
  isReceiving: boolean
  onTicketChange: (ticket: string) => void
  onReceive: () => Promise<void>
}

export interface InstructionsCardProps {
  // No props needed - static content
}
