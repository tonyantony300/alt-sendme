export interface TransferMetadata {
	fileName: string
	fileSize: number
	duration: number
	startTime: number
	endTime: number
	downloadPath?: string
	wasStopped?: boolean
	pathType?: 'file' | 'directory' | null
	thumbnailUrl?: string
}

export interface TransferProgress {
	bytesTransferred: number
	totalBytes: number
	speedBps: number
	percentage: number
	etaSeconds?: number
}

export interface TicketPreviewMetadata {
	fileName: string
	size: number
	thumbnail?: string
	mimeType?: string
}

export interface SuccessScreenProps {
	metadata: TransferMetadata
	onDone: () => void
	wasStopped?: boolean
	onOpenFolder?: () => Promise<void>
}
