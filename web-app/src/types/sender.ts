export interface TransferMetadata {
  fileName: string
  fileSize: number  // bytes
  duration: number  // milliseconds
  startTime: number
  endTime: number
  downloadPath?: string  // Optional for receiver success screen
}

export interface TransferProgress {
  bytesTransferred: number
  totalBytes: number
  speedBps: number // bytes per second
  percentage: number
}

export interface SuccessScreenProps {
  metadata: TransferMetadata
  onDone: () => void
}

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
  isTransporting: boolean
  isCompleted: boolean
  selectedPath: string | null
  pathType: 'file' | 'directory' | null
  ticket: string | null
  copySuccess: boolean
  transferProgress: TransferProgress | null
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
  savePath: string
  onTicketChange: (ticket: string) => void
  onBrowseFolder: () => Promise<void>
  onReceive: () => Promise<void>
}

export interface InstructionsCardProps {
  // No props needed - static content
}

// DragDrop types
export interface DragDropState {
  isDragActive: boolean
  pathType: 'file' | 'directory' | null
  showFullPath: boolean
  alertDialog: AlertDialogState
}

export interface DropzoneProps {
  isDragActive: boolean
  selectedPath: string | null
  pathType: 'file' | 'directory' | null
  showFullPath: boolean
  isLoading: boolean
  onToggleFullPath: () => void
}

export interface BrowseButtonsProps {
  isLoading: boolean
  onBrowseFile: () => Promise<void>
  onBrowseFolder: () => Promise<void>
}
