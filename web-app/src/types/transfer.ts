export interface TransferMetadata {
    fileName: string
    fileSize: number
    duration: number
    startTime: number
    endTime: number
    downloadPath?: string
    wasStopped?: boolean
    pathType?: 'file' | 'directory' | null
}

export interface TransferProgress {
    bytesTransferred: number
    totalBytes: number
    speedBps: number
    percentage: number
    etaSeconds?: number
}

export interface SuccessScreenProps {
    metadata: TransferMetadata
    onDone: () => void
    wasStopped?: boolean
    onOpenFolder?: () => Promise<void>
}
