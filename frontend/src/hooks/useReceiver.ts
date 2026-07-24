import { useCallback, useEffect, useRef, useState } from 'react'
import type { PairedInvitePayload } from '@/lib/pairing-api'
import { IS_ANDROID, IS_WEB } from '@/lib/platform'
import {
	downloadDir,
	invoke,
	joinPath,
	listen,
	openDialog,
	pickDownloadDirectory,
	revealItemInDir,
	supportsWebSaveLocationPicker,
	type UnlistenFn,
} from '@/lib/platform-api'
import {
	getWebPreviewErrorMessage,
	isWebPreviewError,
} from '@/lib/web-preview-error'
import { openDownloadFolder, selectDownloadFolder } from '@/plugins/nativeUtils'
import { useAppSettingStore } from '@/store/app-setting'
import { useReceiverActionsStore } from '@/store/receiver-actions-store'
import { useTransferTabStore } from '@/store/transfer-tab-store'
import { useTranslation } from '../i18n/react-i18next-compat'
import { getRelayConfigArg } from '../lib/relay'
import { getDiscoveryConfigArg } from '../lib/discovery'
import { sendSystemNotification } from '../lib/systemNotification'
import type {
	TicketPreviewMetadata,
	TransferMetadata,
	TransferProgress,
} from '../types/transfer'
import type { AlertDialogState, AlertType } from '../types/ui'
import { calculateETA, SpeedAverager } from '../utils/etaUtils'

interface BackendFileMetadata {
	file_name: string
	item_count: number
	size: number
	thumbnail?: string | null
	mime_type?: string | null
	items?:
		| {
				file_name: string
				size: number
				thumbnail?: string | null
				mime_type?: string | null
		  }[]
		| null
}

const isAbsolutePath = (path: string) => {
	if (!path) return false
	return path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path)
}

const normalizeSeparators = (path: string) => path.replace(/\\/g, '/')

const countTopLevelItems = (names: string[]) => {
	const topLevelItems = new Set<string>()

	for (const name of names) {
		const normalized = normalizeSeparators(name)
		if (!normalized) continue

		if (isAbsolutePath(normalized)) {
			const segments = normalized.split('/').filter(Boolean)
			const lastSegment = segments[segments.length - 1]
			if (lastSegment) {
				topLevelItems.add(lastSegment)
			}
			continue
		}

		const [topLevel] = normalized.split('/')
		if (topLevel) {
			topLevelItems.add(topLevel)
		}
	}

	return topLevelItems.size
}

export interface UseReceiverReturn {
	ticket: string
	isReceiving: boolean
	isTransporting: boolean
	isCompleted: boolean
	savePath: string
	alertDialog: AlertDialogState
	transferMetadata: TransferMetadata | null
	transferProgress: TransferProgress | null
	previewMetadata: TicketPreviewMetadata | null
	isPreviewLoading: boolean
	fileNames: string[]

	handleTicketChange: (ticket: string) => void
	handleBrowseFolder: () => Promise<void>
	handleReceive: () => Promise<void>
	handleOpenFolder: () => Promise<void>
	showAlert: (title: string, description: string, type?: AlertType) => void
	closeAlert: () => void
	resetForNewTransfer: () => Promise<void>
}

export function useReceiver(): UseReceiverReturn {
	const { t } = useTranslation()
	const [ticket, setTicket] = useState('')
	const [isReceiving, setIsReceiving] = useState(false)
	const [isTransporting, setIsTransporting] = useState(false)
	const [isCompleted, setIsCompleted] = useState(false)
	const [savePath, setSavePath] = useState('')
	const downloadsPath = useAppSettingStore((state) => state.downloadsPath)
	const setDownloadsPath = useAppSettingStore((state) => state.setDownloadsPath)
	const downloadsUri = useAppSettingStore((state) => state.downloadsUri)
	const setDownloadsUri = useAppSettingStore((state) => state.setDownloadsUri)
	const downloadsUriRef = useRef(downloadsUri)
	const [transferMetadata, setTransferMetadata] =
		useState<TransferMetadata | null>(null)
	const [transferProgress, setTransferProgress] =
		useState<TransferProgress | null>(null)
	const [transferStartTime, setTransferStartTime] = useState<number | null>(
		null
	)
	const [fileNames, setFileNames] = useState<string[]>([])
	const [previewMetadata, setPreviewMetadata] =
		useState<TicketPreviewMetadata | null>(null)
	const [isPreviewLoading, setIsPreviewLoading] = useState(false)
	const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
		isOpen: false,
		title: '',
		description: '',
		type: 'info',
	})
	const pendingConflictNoticeRef = useRef<string | null>(null)

	const fileNamesRef = useRef<string[]>([])
	const transferProgressRef = useRef<TransferProgress | null>(null)
	const transferStartTimeRef = useRef<number | null>(null)
	const savePathRef = useRef<string>('')
	const folderOpenTriggeredRef = useRef(false)
	// SAF tree URI that can be opened after a successful Android export.
	// Cleared when receive falls back to the app-private staging folder.
	const androidOpenUriRef = useRef('')
	const speedAveragerRef = useRef<SpeedAverager>(new SpeedAverager(10))
	const previewRequestSeqRef = useRef(0)
	const previewMetadataRef = useRef<TicketPreviewMetadata | null>(null)
	const transferItemCountRef = useRef<number | undefined>(undefined)
	// Incremented each time a new transfer starts or is cancelled. Event listeners
	// capture this value and ignore events whose seq no longer matches — preventing
	// ghost completions from a just-cancelled download.
	const transferSeqRef = useRef(0)

	const resolveRevealPath = async (basePath: string, names: string[]) => {
		if (!basePath) return null

		if (names.length === 0) {
			return basePath
		}

		if (names.length === 1) {
			const [name] = names
			if (isAbsolutePath(name)) {
				return name
			}
			try {
				return await joinPath(basePath, name)
			} catch (error) {
				console.error('Failed to join path for reveal:', error)
				return basePath
			}
		}

		const firstName = names[0]

		if (isAbsolutePath(firstName)) {
			const normalized = normalizeSeparators(firstName)
			const parts = normalized.split('/')
			if (parts.length > 1) {
				parts.pop()
				return parts.join('/') || firstName
			}
			return firstName
		}

		const normalized = normalizeSeparators(firstName)
		const [topLevel] = normalized.split('/')
		if (topLevel) {
			try {
				return await joinPath(basePath, topLevel)
			} catch (error) {
				console.error('Failed to join directory path for reveal:', error)
			}
		}

		return basePath
	}

	useEffect(() => {
		fileNamesRef.current = fileNames
	}, [fileNames])

	useEffect(() => {
		transferProgressRef.current = transferProgress
	}, [transferProgress])

	useEffect(() => {
		transferStartTimeRef.current = transferStartTime
	}, [transferStartTime])

	useEffect(() => {
		savePathRef.current = savePath
	}, [savePath])

	useEffect(() => {
		downloadsUriRef.current = downloadsUri
	}, [downloadsUri])

	useEffect(() => {
		const seq = ++previewRequestSeqRef.current

		if (isReceiving) {
			setIsPreviewLoading(false)
			return
		}

		const trimmed = ticket.trim()
		if (!trimmed) {
			setPreviewMetadata(null)
			previewMetadataRef.current = null
			setIsPreviewLoading(false)
			return
		}

		setIsPreviewLoading(true)
		// Clear stale preview while typing/fetching
		setPreviewMetadata(null)
		previewMetadataRef.current = null

		const timer = window.setTimeout(async () => {
			try {
				const payload = await invoke<BackendFileMetadata>(
					'fetch_ticket_metadata',
					{
						ticket: trimmed,
						relay: getRelayConfigArg(),
						discovery: getDiscoveryConfigArg(),
					}
				)

				if (previewRequestSeqRef.current !== seq) {
					return
				}

				const metadata = {
					fileName: payload.file_name,
					itemCount: payload.item_count,
					size: payload.size,
					thumbnail: payload.thumbnail ?? undefined,
					mimeType: payload.mime_type ?? undefined,
					items: payload.items?.map((item) => ({
						fileName: item.file_name,
						size: item.size,
						thumbnail: item.thumbnail ?? undefined,
						mimeType: item.mime_type ?? undefined,
					})),
				}
				setPreviewMetadata(metadata)
				previewMetadataRef.current = metadata
			} catch (error) {
				if (previewRequestSeqRef.current !== seq) {
					return
				}
				console.warn('Failed to fetch ticket preview metadata:', error)
				setPreviewMetadata(null)
				previewMetadataRef.current = null
			} finally {
				if (previewRequestSeqRef.current === seq) {
					setIsPreviewLoading(false)
				}
			}
		}, 300)

		return () => {
			window.clearTimeout(timer)
		}
	}, [ticket, isReceiving])

	const showAlert = useCallback(
		(title: string, description: string, type: AlertType = 'info') => {
			setAlertDialog({ isOpen: true, title, description, type })
		},
		[]
	)

	const closeAlert = useCallback(() => {
		setAlertDialog((prev) => ({ ...prev, isOpen: false }))
	}, [])

	useEffect(() => {
		const initializeSavePath = async () => {
			try {
				if (IS_ANDROID) {
					setSavePath(downloadsPath)
				} else {
					const downloadsPath = await downloadDir()
					setSavePath(downloadsPath)
				}
			} catch (error) {
				console.error('Failed to get downloads directory:', error)
				setSavePath('')
			}
		}
		initializeSavePath()
	}, [downloadsPath])

	useEffect(() => {
		let disposed = false
		const unlistenFns: UnlistenFn[] = []

		const registerListener = async (
			eventName: string,
			handler: Parameters<typeof listen>[1]
		) => {
			const unlisten = await listen(eventName, handler)
			if (disposed) {
				unlisten()
				return
			}
			unlistenFns.push(unlisten)
		}

		const setupListeners = async () => {
			await registerListener('receive-started', () => {
				if (transferSeqRef.current === 0) return
				setIsTransporting(true)
				setIsCompleted(false)
				setTransferStartTime(Date.now())
				setTransferProgress(null)
				speedAveragerRef.current.reset()
			})

			await registerListener('receive-progress', (event: any) => {
				if (transferSeqRef.current === 0) return
				try {
					const payload = event.payload as string
					const parts = payload.split(':')

					if (parts.length === 3) {
						const bytesTransferred = parseInt(parts[0], 10)
						const totalBytes = parseInt(parts[1], 10)
						const speedInt = parseInt(parts[2], 10)
						const speedBps = speedInt / 1000.0
						const percentage =
							totalBytes > 0
								? Math.min((bytesTransferred / totalBytes) * 100, 100)
								: 0

						// Add speed sample and calculate ETA
						speedAveragerRef.current.addSample(speedBps)
						const avgSpeed = speedAveragerRef.current.getAverage()
						const bytesRemaining = Math.max(totalBytes - bytesTransferred, 0)
						const eta = calculateETA(bytesRemaining, avgSpeed)

						setTransferProgress({
							bytesTransferred,
							totalBytes,
							speedBps,
							percentage,
							etaSeconds: eta ?? undefined,
						})
					}
				} catch (error) {
					console.error('Failed to parse progress event:', error)
				}
			})

			await registerListener('receive-file-names', (event: any) => {
				if (transferSeqRef.current === 0) return
				try {
					const payload = event.payload as string
					const names = JSON.parse(payload) as string[]

					setFileNames(names)
					fileNamesRef.current = names
				} catch (error) {
					console.error('Failed to parse file names event:', error)
				}
			})

			await registerListener('receive-download-fallback', (event: any) => {
				if (!IS_ANDROID) return
				try {
					const payload = event.payload as
						| string
						| { path?: string; reason?: string }
					const fallbackPath =
						typeof payload === 'string'
							? payload.trim()
							: String(payload?.path ?? '').trim()
					const reason =
						typeof payload === 'object' ? payload?.reason : undefined
					if (!fallbackPath) return
					androidOpenUriRef.current = ''
					setSavePath(fallbackPath)
					setTransferMetadata((prev) =>
						prev ? { ...prev, downloadPath: fallbackPath } : prev
					)
					showAlert(
						t('common:receiver.downloadFallbackTitle'),
						reason === 'saf'
							? t('common:receiver.downloadFallbackSafDescription', {
									path: fallbackPath,
								})
							: t('common:receiver.downloadFallbackDescription', {
									path: fallbackPath,
								}),
						'info'
					)
				} catch (error) {
					console.error('Failed to handle download fallback notice:', error)
				}
			})

			await registerListener('receive-conflicts', (event: any) => {
				if (transferSeqRef.current === 0) return
				try {
					const payload = event.payload as string
					const conflicts = JSON.parse(payload) as Array<{
						original: string
						resolved: string
					}>

					if (conflicts.length === 0) return

					const basename = (p: string) =>
						normalizeSeparators(p).split('/').pop() || p
					const preview = conflicts
						.slice(0, 3)
						.map((c) => `${basename(c.original)} → ${basename(c.resolved)}`)
						.join('\n')

					pendingConflictNoticeRef.current =
						conflicts.length > 3
							? `${preview}\n${t('common:receiver.conflictsMore', {
									count: conflicts.length - 3,
								})}`
							: preview
				} catch (error) {
					console.error('Failed to parse receive-conflicts event:', error)
				}
			})

			await registerListener('receive-completed', () => {
				if (transferSeqRef.current === 0) return
				setIsTransporting(false)
				setIsCompleted(true)
				setTransferProgress(null)

				const endTime = Date.now()
				const duration = transferStartTimeRef.current
					? endTime - transferStartTimeRef.current
					: 0

				const currentFileNames = fileNamesRef.current
				const itemCount =
					transferItemCountRef.current ?? countTopLevelItems(currentFileNames)
				let displayName = t('common:receiver.downloadedFile')

				if (previewMetadataRef.current?.fileName) {
					displayName = previewMetadataRef.current.fileName
				} else if (currentFileNames.length > 0) {
					if (itemCount <= 1) {
						const fullPath = currentFileNames[0]
						displayName = fullPath.split('/').pop() || fullPath
					} else {
						const multipleFilesLabel = t('common:transfer.multipleFiles', {
							count: itemCount,
						})
						const firstPath = currentFileNames[0]
						const pathParts = firstPath.split('/')
						if (pathParts.length > 1) {
							displayName = pathParts[0] || multipleFilesLabel
						} else {
							displayName = multipleFilesLabel
						}
					}
				}

				let pathType: 'file' | 'directory' | null = null
				if (previewMetadataRef.current) {
					if (previewMetadataRef.current.mimeType === 'inode/directory') {
						pathType = 'directory'
					} else {
						pathType = 'file'
					}
				} else if (itemCount === 1 && currentFileNames.length > 1) {
					pathType = 'directory'
				} else if (itemCount === 1) {
					pathType = 'file'
				}

				const metadata = {
					fileName: displayName,
					fileSize: transferProgressRef.current?.totalBytes || 0,
					duration,
					startTime: transferStartTimeRef.current || endTime,
					endTime,
					downloadPath: savePathRef.current,
					itemCount: itemCount > 1 ? itemCount : undefined,
					pathType,
				}
				setTransferMetadata(metadata)

				if (pendingConflictNoticeRef.current) {
					showAlert(
						t('common:receiver.downloadCompletedWithConflicts'),
						pendingConflictNoticeRef.current,
						'info'
					)
					pendingConflictNoticeRef.current = null
				}

				void sendSystemNotification({
					title: t('common:receiver.downloadCompleted'),
					body: displayName,
				})
			})
		}

		setupListeners().catch((error) => {
			console.error('Failed to set up event listeners:', error)
		})

		return () => {
			disposed = true
			unlistenFns.forEach((unlisten) => {
				unlisten()
			})
		}
	}, [t, showAlert])

	const handleTicketChange = useCallback((newTicket: string) => {
		setTicket(newTicket)
	}, [])

	const handleBrowseFolder = useCallback(async () => {
		if (isReceiving) return
		try {
			let selected: string | null
			if (IS_ANDROID) {
				const response = await selectDownloadFolder()
				if (!response) return
				selected = response.path
				setDownloadsPath(selected)
				setDownloadsUri(response.uri)
			} else if (IS_WEB) {
				if (!supportsWebSaveLocationPicker()) {
					return
				}
				selected = await pickDownloadDirectory()
			} else {
				const dialogSelection = await openDialog({
					multiple: false,
					directory: true,
				})
				selected = Array.isArray(dialogSelection)
					? (dialogSelection[0] ?? null)
					: dialogSelection
			}

			if (selected) {
				setSavePath(selected)
			}
		} catch (error) {
			console.error('Failed to open folder dialog:', error)
			showAlert(
				t('common:errors.folderDialogFailed'),
				`${t('common:errors.folderDialogFailedDesc')}: ${error}`,
				'error'
			)
		}
	}, [isReceiving, setDownloadsPath, setDownloadsUri, showAlert, t])

	const receiveWithTicket = useCallback(
		async (ticketValue: string) => {
			if (!ticketValue.trim()) return

			try {
				if (transferItemCountRef.current == null) {
					transferItemCountRef.current =
						previewMetadataRef.current?.itemCount ?? previewMetadata?.itemCount
				}
				previewRequestSeqRef.current += 1
				transferSeqRef.current += 1
				setIsReceiving(true)
				setIsTransporting(false)
				setIsCompleted(false)
				setTransferMetadata(null)
				setTransferProgress(null)
				setTransferStartTime(null)
				setIsPreviewLoading(false)
				pendingConflictNoticeRef.current = null
				folderOpenTriggeredRef.current = false
				androidOpenUriRef.current = IS_ANDROID
					? downloadsUriRef.current.trim()
					: ''

				let outputPath = savePathRef.current.trim()
				if (!outputPath && !IS_WEB && !IS_ANDROID) {
					outputPath = await downloadDir()
					setSavePath(outputPath)
					savePathRef.current = outputPath
				}

				await invoke<string>('receive_file', {
					ticket: ticketValue.trim(),
					outputPath,
					treeUri: IS_ANDROID ? downloadsUriRef.current.trim() || null : null,
					relay: getRelayConfigArg(),
					discovery: getDiscoveryConfigArg(),
				})
			} catch (error) {
				if (
					String(error) === 'cancelled' ||
					String(error).endsWith(': cancelled')
				)
					return

				console.error('Failed to receive file:', error)
				showAlert(
					t('common:errors.receiveFailed'),
					isWebPreviewError(error)
						? getWebPreviewErrorMessage(
								error,
								t('common:webPreview.transferUnavailable')
							)
						: String(error),
					'error'
				)
				setIsReceiving(false)
				setIsTransporting(false)
				setIsCompleted(false)
			}
		},
		[previewMetadata, showAlert, t]
	)

	const handleReceive = async () => {
		await receiveWithTicket(ticket)
	}

	const acceptPairedInvite = useCallback(
		async (invite: PairedInvitePayload) => {
			if (isReceiving || isTransporting) {
				showAlert(
					t('common:receiver.receiveBusyTitle'),
					t('common:receiver.receiveBusyDescription'),
					'info'
				)
				return
			}

			useTransferTabStore.getState().requestTab('receive')

			const preview: TicketPreviewMetadata = {
				fileName: invite.sender_name,
				itemCount: invite.file_count,
				size: invite.total_size,
				mimeType:
					invite.file_count > 1 ? 'application/x-iroh-collection' : undefined,
			}
			setTicket(invite.blob_ticket)
			setPreviewMetadata(preview)
			previewMetadataRef.current = preview
			transferItemCountRef.current = invite.file_count
			previewRequestSeqRef.current += 1
			setIsPreviewLoading(false)

			await receiveWithTicket(invite.blob_ticket)
		},
		[isReceiving, isTransporting, receiveWithTicket, showAlert, t]
	)

	const registerAcceptPairedInvite = useReceiverActionsStore(
		(state) => state.registerAcceptPairedInvite
	)
	const registerBrowseSaveFolder = useReceiverActionsStore(
		(state) => state.registerBrowseSaveFolder
	)
	const setReceiverSavePath = useReceiverActionsStore(
		(state) => state.setReceiverSavePath
	)

	useEffect(() => {
		registerAcceptPairedInvite(acceptPairedInvite)
		return () => registerAcceptPairedInvite(null)
	}, [acceptPairedInvite, registerAcceptPairedInvite])

	useEffect(() => {
		registerBrowseSaveFolder(handleBrowseFolder)
		return () => registerBrowseSaveFolder(null)
	}, [handleBrowseFolder, registerBrowseSaveFolder])

	useEffect(() => {
		setReceiverSavePath(savePath)
	}, [savePath, setReceiverSavePath])

	const resetForNewTransfer = async () => {
		// Zero the seq first so in-flight events from the cancelled transfer are ignored.
		transferSeqRef.current = 0
		previewRequestSeqRef.current += 1

		// Tell the backend to cancel the active download (idempotent if none active).
		invoke('cancel_receive').catch(() => {})

		setIsReceiving(false)
		setIsTransporting(false)
		setIsCompleted(false)
		setTicket('')
		setTransferMetadata(null)
		setTransferProgress(null)
		setTransferStartTime(null)
		setFileNames([])
		setPreviewMetadata(null)
		setIsPreviewLoading(false)
		pendingConflictNoticeRef.current = null
		folderOpenTriggeredRef.current = false
		androidOpenUriRef.current = ''
		transferItemCountRef.current = undefined
	}

	const handleOpenFolder = async () => {
		if (IS_WEB || folderOpenTriggeredRef.current) {
			return
		}

		try {
			folderOpenTriggeredRef.current = true

			if (IS_ANDROID) {
				const treeUri = androidOpenUriRef.current.trim()
				if (!treeUri) {
					folderOpenTriggeredRef.current = false
					showAlert(
						t('common:errors.openFolderFailed'),
						t('common:errors.openFolderUnavailableDesc'),
						'error'
					)
					return
				}
				await openDownloadFolder(treeUri)
				return
			}

			if (!savePath) {
				folderOpenTriggeredRef.current = false
				return
			}

			const targetPath = await resolveRevealPath(savePath, fileNamesRef.current)
			if (targetPath) {
				await revealItemInDir(targetPath)
			}
		} catch (error) {
			folderOpenTriggeredRef.current = false
			console.error('Failed to open download folder:', error)
			showAlert(
				t('common:errors.openFolderFailed'),
				`${t('common:errors.openFolderFailedDesc')}: ${error}`,
				'error'
			)
		}
	}

	return {
		ticket,
		isReceiving,
		isTransporting,
		isCompleted,
		savePath,
		alertDialog,
		transferMetadata,
		transferProgress,
		previewMetadata,
		isPreviewLoading,
		fileNames,

		handleTicketChange,
		handleBrowseFolder,
		handleReceive,
		handleOpenFolder,
		showAlert,
		closeAlert,
		resetForNewTransfer,
	}
}
