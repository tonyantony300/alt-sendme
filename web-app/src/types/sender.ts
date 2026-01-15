import type { AlertDialogState } from './ui'
import type { TransferProgress } from './transfer'

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
