import type { PairedDevice } from '@/lib/pairing-api'
import type { TransferProgress } from './transfer'
import type { AlertDialogState } from './ui'

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
	pairedDevices?: PairedDevice[]
	isNodeReady?: boolean
	isNodeStatusPending?: boolean
	pairedInviteStatus?: Record<string, 'sending' | 'sent' | 'failed'>
	onInvitePairedDevice?: (endpointId: string) => Promise<boolean>
	onInviteNearbyDevice?: (endpointId: string) => Promise<boolean>
	onStartSharing: () => Promise<void>
	onStopSharing: () => Promise<void>
	onCopyTicket: () => Promise<void>
	onSetBroadcast: (broadcast: boolean) => void
}

export interface DragDropState {
	isDragActive: boolean
	pathType: 'file' | 'directory' | null
	showFullPath: boolean
	alertDialog: AlertDialogState
}

export interface DropzoneDragProps {
	onDragEnter: (event: React.DragEvent<HTMLElement>) => void
	onDragOver: (event: React.DragEvent<HTMLElement>) => void
	onDragLeave: (event: React.DragEvent<HTMLElement>) => void
	onDrop: (event: React.DragEvent<HTMLElement>) => void
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
	onAddFolders: () => Promise<void>
	onRemoveSelectedPath: (path: string) => void
	onClearSelection: () => void
	/** Open the file picker when the empty dropzone is clicked. */
	onEmptyClick?: () => void | Promise<void>
	dropzoneDragProps?: DropzoneDragProps
}

export interface BrowseButtonsProps {
	isLoading: boolean
	onBrowseFile: () => Promise<void>
	onBrowseFolder: () => Promise<void>
}
