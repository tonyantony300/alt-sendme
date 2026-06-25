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
	private channel: Channel<CopyProgress>
	private active = true

	constructor(channel: Channel<CopyProgress>) {
		this.channel = channel
	}

	public async cancelJob() {
		if (!this.active) return
		await invoke<void>('plugin:native-utils|cancel_job', {
			job: { channelId: this.channel.id },
		})
		this.active = false
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
	return new FileSelectedHandler(channel)
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
	const response = await invoke<boolean>(
		'plugin:native-utils|select_send_folder',
		{
			channel: channel,
		}
	)
	if (!response) return null
	return new FileSelectedHandler(channel)
}
