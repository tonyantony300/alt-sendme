import { Channel, invoke } from '@tauri-apps/api/core'

export type DownloadFolderSelectionResponse = {
	uri: string
	path: string
}

export type CopyProgress = {
	totalBytes: string
	progress: number
	cachedPath?: string
}

export class FileSelectedHandler {
	private channelId: number
	private active = true

	constructor(channelId: number) {
		this.channelId = channelId
	}

	public async cancelJob() {
		if (this.active) {
			this.active = false
			return await invoke<void>('plugin:native-utils|cancel_job', {
				channelId: this.channelId,
			})
		}
	}
}

export async function selectDownloadFolder(): Promise<DownloadFolderSelectionResponse | null> {
	return await invoke<DownloadFolderSelectionResponse>(
		'plugin:native-utils|select_download_folder'
	)
}

export async function selectSendDocument(
	onStart: (path: string, size: BigInt) => void,
	onEvent: (event: CopyProgress) => void,
	onComplete: (path: string) => void
): Promise<FileSelectedHandler | null> {
	const channel = new Channel<CopyProgress>()
	channel.onmessage = (event: CopyProgress) => {
		if (event.progress === 0 && event.cachedPath) {
			onStart(event.cachedPath, BigInt(event.totalBytes))
		} else if (event.progress === 1 && event.cachedPath) {
			onComplete(event.cachedPath)
		} else {
			onEvent(event)
		}
	}
	const response = await invoke<boolean | undefined>(
		'plugin:native-utils|select_send_document',
		{
			channel: channel,
		}
	)
	if (!response) return null
	return new FileSelectedHandler(channel.id)
}

export async function selectSendFolder(
	onStart: (path: string, size: BigInt) => void,
	onEvent: (event: CopyProgress) => void,
	onComplete: (path: string) => void
): Promise<FileSelectedHandler | null> {
	const channel = new Channel<CopyProgress>()
	channel.onmessage = (event: CopyProgress) => {
		if (event.progress === 0 && event.cachedPath) {
			onStart(event.cachedPath, BigInt(event.totalBytes))
		} else if (event.progress === 1 && event.cachedPath) {
			onComplete(event.cachedPath)
		} else {
			onEvent(event)
		}
	}
	const response = await invoke<boolean | undefined>(
		'plugin:native-utils|select_send_folder',
		{
			channel: channel,
		}
	)
	if (!response) return null
	return new FileSelectedHandler(channel.id)
}
