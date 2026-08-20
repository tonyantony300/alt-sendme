export interface TransferMetadata {
	fileName: string
	fileSize: number
	/** Time on the wire, as measured by the engine. */
	duration: number
	/** Receiver only: time spent writing the files out to disk after transfer. */
	writeMs?: number
	startTime: number
	endTime: number
	downloadPath?: string
	wasStopped?: boolean
	pathType?: 'file' | 'directory' | null
	thumbnailUrl?: string
	itemCount?: number
}

export interface TransferProgress {
	bytesTransferred: number
	totalBytes: number
	speedBps: number
	percentage: number
	scope?: 'total' | 'file'
	currentFileName?: string
	fileIndex?: number
	totalFiles?: number
	etaSeconds?: number
}

export interface TicketPreviewMetadata {
	fileName: string
	itemCount: number
	size: number
	thumbnail?: string
	mimeType?: string
	items?: TicketPreviewItem[]
}

export interface TicketPreviewItem {
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
	/**
	 * Hold "Open" disabled — the files are still being written to their final
	 * destination, so there is nothing to open yet.
	 */
	isOpenPending?: boolean
}
