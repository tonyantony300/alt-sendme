import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { downloadDir, join } from '@tauri-apps/api/path'
import { open } from '@tauri-apps/plugin-dialog'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import { selectDownloadFolder } from '@/plugins/nativeUtils'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../i18n/react-i18next-compat'
import { sendSystemNotification } from '../lib/systemNotification'
import type { AlertDialogState, AlertType } from '../types/ui'
import type {
	TicketPreviewMetadata,
	TransferMetadata,
	TransferProgress,
} from '../types/transfer'
import { SpeedAverager, calculateETA } from '../utils/etaUtils'
import { IS_ANDROID } from '@/lib/platform'

interface BackendFileMetadata {
	file_name: string
	size: number
	thumbnail?: string | null
	mime_type?: string | null
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

	const fileNamesRef = useRef<string[]>([])
	const transferProgressRef = useRef<TransferProgress | null>(null)
	const transferStartTimeRef = useRef<number | null>(null)
	const savePathRef = useRef<string>('')
	const folderOpenTriggeredRef = useRef(false)
	const speedAveragerRef = useRef<SpeedAverager>(new SpeedAverager(10))
	const previewRequestSeqRef = useRef(0)

	const isAbsolutePath = (path: string) => {
		if (!path) return false
		return path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path)
	}

	const normalizeSeparators = (path: string) => path.replace(/\\/g, '/')

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
				return await join(basePath, name)
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
				return await join(basePath, topLevel)
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
		const seq = ++previewRequestSeqRef.current

		if (isReceiving) {
			setIsPreviewLoading(false)
			return
		}

		const trimmed = ticket.trim()
		if (!trimmed) {
			setPreviewMetadata(null)
			setIsPreviewLoading(false)
			return
		}

		setIsPreviewLoading(true)
		// Clear stale preview while typing/fetching
		setPreviewMetadata(null)

		const timer = window.setTimeout(async () => {
			try {
				const payload = await invoke<BackendFileMetadata>(
					'fetch_ticket_metadata',
					{
						ticket: trimmed,
					}
				)

				if (previewRequestSeqRef.current !== seq) {
					return
				}

				setPreviewMetadata({
					fileName: payload.file_name,
					size: payload.size,
					thumbnail: payload.thumbnail ?? undefined,
					mimeType: payload.mime_type ?? undefined,
				})
			} catch {
				if (previewRequestSeqRef.current !== seq) {
					return
				}
				setPreviewMetadata(null)
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

	const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
		isOpen: false,
		title: '',
		description: '',
		type: 'info',
	})

	useEffect(() => {
		const initializeSavePath = async () => {
			try {
				const downloadsPath = await downloadDir()
				setSavePath(downloadsPath)
			} catch (error) {
				console.error('Failed to get downloads directory:', error)
				setSavePath('')
			}
		}
		initializeSavePath()
	}, [])

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
				setIsTransporting(true)
				setIsCompleted(false)
				setTransferStartTime(Date.now())
				setTransferProgress(null)
				speedAveragerRef.current.reset()
			})

			await registerListener('receive-progress', (event: any) => {
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
				try {
					const payload = event.payload as string
					const names = JSON.parse(payload) as string[]

					setFileNames(names)
					fileNamesRef.current = names
				} catch (error) {
					console.error('Failed to parse file names event:', error)
				}
			})

			await registerListener('receive-completed', () => {
				setIsTransporting(false)
				setIsCompleted(true)
				setTransferProgress(null)

				const endTime = Date.now()
				const duration = transferStartTimeRef.current
					? endTime - transferStartTimeRef.current
					: 0

				const currentFileNames = fileNamesRef.current
				let displayName = 'Downloaded File'

				if (currentFileNames.length > 0) {
					if (currentFileNames.length === 1) {
						const fullPath = currentFileNames[0]
						displayName = fullPath.split('/').pop() || fullPath
					} else {
						const firstPath = currentFileNames[0]
						const pathParts = firstPath.split('/')
						if (pathParts.length > 1) {
							displayName = pathParts[0] || `${currentFileNames.length} files`
						} else {
							displayName = `${currentFileNames.length} files`
						}
					}
				}

				const metadata = {
					fileName: displayName,
					fileSize: transferProgressRef.current?.totalBytes || 0,
					duration,
					startTime: transferStartTimeRef.current || endTime,
					endTime,
					downloadPath: savePathRef.current,
				}
				setTransferMetadata(metadata)

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
	}, [t])

	const showAlert = (
		title: string,
		description: string,
		type: AlertType = 'info'
	) => {
		setAlertDialog({ isOpen: true, title, description, type })
	}

	const closeAlert = () => {
		setAlertDialog((prev) => ({ ...prev, isOpen: false }))
	}

	const handleTicketChange = (newTicket: string) => {
		setTicket(newTicket)
	}

	const handleBrowseFolder = async () => {
		if (isReceiving) return
		try {
			let selected: string | null
			if (IS_ANDROID) {
				const response = await selectDownloadFolder()
				if (!response) return
				selected = response.path.toString()
			} else {
				selected = await open({
					multiple: false,
					directory: true,
				})
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
	}

	const handleReceive = async () => {
		if (!ticket.trim()) return

		try {
			previewRequestSeqRef.current += 1
			setIsReceiving(true)
			setIsTransporting(false)
			setIsCompleted(false)
			setTransferMetadata(null)
			setTransferProgress(null)
			setTransferStartTime(null)
			setPreviewMetadata(null)
			setIsPreviewLoading(false)
			folderOpenTriggeredRef.current = false

			await invoke<string>('receive_file', {
				ticket: ticket.trim(),
				outputPath: savePath,
			})
		} catch (error) {
			console.error('Failed to receive file:', error)
			showAlert(t('common:errors.receiveFailed'), String(error), 'error')
			setIsReceiving(false)
			setIsTransporting(false)
			setIsCompleted(false)
		}
	}

	const resetForNewTransfer = async () => {
		previewRequestSeqRef.current += 1
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
		folderOpenTriggeredRef.current = false
	}

	const handleOpenFolder = async () => {
		if (!savePath || folderOpenTriggeredRef.current) {
			return
		}

		try {
			folderOpenTriggeredRef.current = true
			const targetPath = await resolveRevealPath(savePath, fileNamesRef.current)
			if (targetPath) {
				await revealItemInDir(targetPath)
			}
		} catch (error) {
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
