import type { AlertDialogState } from './ui'
import type { TransferProgress } from './transfer'

export interface SharingState {
	isSharing: boolean
	ticket: string | null
	selectedPaths: string[]
	selectedPath: string | null
	isLoading: boolean
	isBroadcastMode: boolean
}

export interface CopyState {
	copySuccess: boolean
}

export interface SenderState extends SharingState, CopyState {
	alertDialog: AlertDialogState
}

export interface ShareActionProps {
	selectedPaths: string[]
	selectedPath: string | null
	isLoading: boolean
}

export interface SharingControlsProps {
	isSharing: boolean
	isLoading: boolean
	isTransporting: boolean
	isCompleted: boolean
	selectedPaths: string[]
	selectedPath: string | null
	pathType: 'file' | 'directory' | null
	ticket: string | null
	copySuccess: boolean
	transferProgress: TransferProgress | null
	isBroadcastMode: boolean
	activeConnectionCount?: number
	onStartSharing: () => Promise<void>
	onStopSharing: () => Promise<void>
	onCopyTicket: () => Promise<void>
	onSetBroadcast: (broadcast: boolean) => void
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
	selectedPaths: string[]
	selectedPath: string | null
	pathType: 'file' | 'directory' | null
	showFullPath: boolean
	isLoading: boolean
	onToggleFullPath: () => void
	onAddFiles: () => Promise<void>
	onClearSelection: () => void
}

export interface BrowseButtonsProps {
	isLoading: boolean
	onBrowseFile: () => Promise<void>
	onBrowseFolder: () => Promise<void>
}
