import { IS_TAURI } from '@/lib/platform'
import { invoke, openDialog, pickDownloadDirectory } from '@/lib/platform-api'

export type DownloadFolderSelectionResponse = {
	uri: string
	path: string
}

export type CopyProgress = {
	totalBytes: string
	progress: number
	cachedPath?: string
	cachedPaths?: string
	completed?: boolean
	error?: string
}

export class FileSelectedHandler {
	private channelId: string
	private active = true

	constructor(channelId: string) {
		this.channelId = channelId
	}

	public async cancelJob() {
		if (!this.active) return
		await invoke<void>('plugin:native-utils|cancel_job', {
			job: { channelId: this.channelId },
		})
		this.active = false
	}
}

export async function selectDownloadFolder(): Promise<DownloadFolderSelectionResponse | null> {
	if (!IS_TAURI) {
		const path = await pickDownloadDirectory()
		if (!path) return null
		return { uri: path, path }
	}

	return await invoke<DownloadFolderSelectionResponse>(
		'plugin:native-utils|select_download_folder'
	)
}

/**
 * Show a MediaStore-exported receive: a single file's `content://` URI opens it
 * directly, `relativePath` opens the folder a multi-file export landed in. With
 * no tree URI there's no SAF folder to open, so Downloads is the last resort.
 */
export async function openDownloadTarget(
	uri: string,
	relativePath = ''
): Promise<void> {
	if (!IS_TAURI) return

	await invoke<void>('plugin:native-utils|open_download_target', {
		uri,
		relativePath,
	})
}

/** Open the selected Android SAF download folder in a system file manager. */
export async function openDownloadFolder(treeUri: string): Promise<void> {
	if (!IS_TAURI) return

	await invoke<void>('plugin:native-utils|open_download_folder', {
		treeUri,
	})
}

type CopyHandlers = {
	onStart: (path: string, size: bigint) => void
	onEvent: (event: CopyProgress) => void
	onComplete: (paths: string[]) => void
	onError?: (message: string) => void
}

function bindCopyChannel(
	channel: { onmessage: (event: CopyProgress) => void },
	handlers: CopyHandlers
) {
	channel.onmessage = (event: CopyProgress) => {
		const cachedPaths = event.cachedPaths
			? (JSON.parse(event.cachedPaths) as string[])
			: null
		if (event.error) {
			handlers.onError?.(event.error)
			return
		}
		if (cachedPaths && event.completed) {
			handlers.onComplete(cachedPaths)
		} else if (event.cachedPath && event.completed) {
			handlers.onComplete([event.cachedPath])
		} else if (
			event.cachedPath &&
			(event.progress === 0 || event.progress === 0.0)
		) {
			handlers.onStart(event.cachedPath, BigInt(event.totalBytes || '0'))
		} else {
			handlers.onEvent(event)
		}
	}
}

export async function selectSendDocument(
	onStart: (path: string, size: bigint) => void,
	onEvent: (event: CopyProgress) => void,
	onComplete: (paths: string[]) => void,
	onError?: (message: string) => void
): Promise<FileSelectedHandler | null> {
	if (!IS_TAURI) {
		const selected = await openDialog({ multiple: true, directory: false })
		if (!selected) return null
		const paths = Array.isArray(selected) ? selected : [selected]
		for (const path of paths) {
			onStart(path, BigInt(0))
			onComplete([path])
		}
		return null
	}

	const { Channel } = await import('@tauri-apps/api/core')
	const channel = new Channel<CopyProgress>()
	bindCopyChannel(channel, { onStart, onEvent, onComplete, onError })
	const response = await invoke<boolean | undefined>(
		'plugin:native-utils|select_send_document',
		{
			channel: channel,
		}
	)
	if (!response) return null
	return new FileSelectedHandler(String(channel.id))
}

export async function selectSendFolder(
	onStart: (path: string, size: bigint) => void,
	onEvent: (event: CopyProgress) => void,
	onComplete: (paths: string[]) => void,
	onError?: (message: string) => void
): Promise<FileSelectedHandler | null> {
	if (!IS_TAURI) {
		const selected = await openDialog({ multiple: false, directory: true })
		if (!selected) return null
		const path = Array.isArray(selected) ? selected[0] : selected
		if (!path) return null
		onStart(path, BigInt(0))
		onComplete([path])
		return null
	}

	const { Channel } = await import('@tauri-apps/api/core')
	const channel = new Channel<CopyProgress>()
	bindCopyChannel(channel, { onStart, onEvent, onComplete, onError })
	const response = await invoke<boolean>(
		'plugin:native-utils|select_send_folder',
		{
			channel: channel,
		}
	)
	if (!response) return null
	return new FileSelectedHandler(String(channel.id))
}

export async function consumeShareIntent(
	onStart: (path: string, size: bigint) => void,
	onEvent: (event: CopyProgress) => void,
	onComplete: (paths: string[]) => void,
	onError?: (message: string) => void
): Promise<FileSelectedHandler | null> {
	if (!IS_TAURI) return null

	const { Channel } = await import('@tauri-apps/api/core')
	const channel = new Channel<CopyProgress>()
	bindCopyChannel(channel, { onStart, onEvent, onComplete, onError })
	const response = await invoke<boolean | undefined>(
		'plugin:native-utils|consume_share_intent',
		{ channel }
	)
	if (!response) return null
	return new FileSelectedHandler(String(channel.id))
}

/** Fired when a share arrives while the app is already open. */
export async function onShareReceived(
	handler: () => void
): Promise<() => void> {
	if (!IS_TAURI) return () => {}

	const { addPluginListener } = await import('@tauri-apps/api/core')
	const listener = await addPluginListener(
		'native-utils',
		'shareReceived',
		() => {
			handler()
		}
	)
	return () => {
		void listener.unregister()
	}
}
