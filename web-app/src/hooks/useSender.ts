import { useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { useTranslation } from '../i18n/react-i18next-compat'
import type { AlertType } from '../types/ui'
import type { TransferMetadata, TransferProgress } from '../types/transfer'
import { SpeedAverager, calculateETA } from '../utils/etaUtils'
import { useSenderStore } from '../store/sender-store'

export interface UseSenderReturn {
	// View state (replaces isSharing, isTransporting, isCompleted)
	viewState: 'IDLE' | 'SHARING' | 'TRANSPORTING' | 'SUCCESS'

	// Derived states for backward compatibility
	isSharing: boolean
	isTransporting: boolean
	isCompleted: boolean

	ticket: string | null
	selectedPath: string | null
	pathType: 'file' | 'directory' | null
	isLoading: boolean
	copySuccess: boolean
	alertDialog: any
	transferMetadata: TransferMetadata | null
	transferProgress: TransferProgress | null
	isBroadcastMode: boolean

	handleFileSelect: (path: string) => void
	startSharing: () => Promise<void>
	stopSharing: () => Promise<void>
	copyTicket: () => Promise<void>
	showAlert: (title: string, description: string, type?: AlertType) => void
	closeAlert: () => void
	resetForNewTransfer: () => Promise<void>
	toggleBroadcastMode: () => void
}

export function useSender(): UseSenderReturn {
	const { t } = useTranslation()

	// Get store state and actions
	const {
		viewState,
		ticket,
		selectedPath,
		pathType,
		isLoading,
		copySuccess,
		alertDialog,
		transferMetadata,
		transferProgress,
		isBroadcastMode,
		setViewState,
		setTicket,
		setSelectedPath,
		setPathType,
		setIsLoading,
		setCopySuccess,
		setTransferMetadata,
		setTransferProgress,
		setIsBroadcastMode,
		toggleBroadcastMode,
		showAlert,
		closeAlert,
		resetToIdle,
		resetForBroadcast,
	} = useSenderStore()

	// Refs for event listeners
	const latestProgressRef = useRef<TransferProgress | null>(null)
	const transferStartTimeRef = useRef<number | null>(null)
	const progressUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
	const wasManuallyStoppedRef = useRef(false)
	const selectedPathRef = useRef<string | null>(null)
	const pathTypeRef = useRef<'file' | 'directory' | null>(null)
	const speedAveragerRef = useRef<SpeedAverager>(new SpeedAverager(10))

	useEffect(() => {
		selectedPathRef.current = selectedPath
	}, [selectedPath])

	useEffect(() => {
		pathTypeRef.current = pathType
	}, [pathType])

	useEffect(() => {
		let unlistenStart: UnlistenFn | undefined
		let unlistenProgress: UnlistenFn | undefined
		let unlistenComplete: UnlistenFn | undefined
		let unlistenFailed: UnlistenFn | undefined

		const setupListeners = async () => {
			unlistenStart = await listen('transfer-started', () => {
				transferStartTimeRef.current = Date.now()
				latestProgressRef.current = null
				speedAveragerRef.current.reset()

				setViewState('TRANSPORTING')
				setTransferProgress(null)
				setTransferMetadata(null)
				wasManuallyStoppedRef.current = false

				if (progressUpdateIntervalRef.current) {
					clearInterval(progressUpdateIntervalRef.current)
				}
				progressUpdateIntervalRef.current = setInterval(() => {
					if (latestProgressRef.current && viewState === 'TRANSPORTING') {
						setTransferProgress(latestProgressRef.current)
					}
				}, 50)
			})

			unlistenProgress = await listen('transfer-progress', (event: any) => {
				try {
					const payload = event.payload as string
					const parts = payload.split(':')

					if (parts.length === 3) {
						const bytesTransferred = parseInt(parts[0], 10)
						const totalBytes = parseInt(parts[1], 10)
						const speedInt = parseInt(parts[2], 10)
						const speedBps = speedInt / 1000.0
						const percentage =
							totalBytes > 0 ? (bytesTransferred / totalBytes) * 100 : 0

						// Add speed sample and calculate ETA
						speedAveragerRef.current.addSample(speedBps)
						const avgSpeed = speedAveragerRef.current.getAverage()
						const bytesRemaining = totalBytes - bytesTransferred
						const eta = calculateETA(bytesRemaining, avgSpeed)

						latestProgressRef.current = {
							bytesTransferred,
							totalBytes,
							speedBps,
							percentage,
							etaSeconds: eta ?? undefined,
						}
					}
				} catch (error) {
					console.error('Failed to parse progress event:', error)
				}
			})

			unlistenComplete = await listen('transfer-completed', async () => {
				if (wasManuallyStoppedRef.current) {
					return
				}

				if (progressUpdateIntervalRef.current) {
					clearInterval(progressUpdateIntervalRef.current)
					progressUpdateIntervalRef.current = null
				}

				if (latestProgressRef.current) {
					setTransferProgress(latestProgressRef.current)
				}

				await new Promise((resolve) => setTimeout(resolve, 10))

				const endTime = Date.now()
				const duration = transferStartTimeRef.current
					? endTime - transferStartTimeRef.current
					: 0

				const currentPath = selectedPathRef.current
				const currentPathType = pathTypeRef.current
				if (currentPath) {
					const fileName = currentPath.split('/').pop() || 'Unknown'
					const estimatedFileSize = latestProgressRef.current?.totalBytes || 0

					setTransferMetadata({
						fileName,
						fileSize: estimatedFileSize,
						duration,
						startTime: transferStartTimeRef.current || endTime,
						endTime,
						pathType: currentPathType,
					})

					// Check if broadcast mode is enabled
					const currentBroadcastMode = useSenderStore.getState().isBroadcastMode
					if (currentBroadcastMode) {
						// In broadcast mode: reset to listening state after a brief delay
						setTimeout(() => {
							resetForBroadcast()
							latestProgressRef.current = null
							transferStartTimeRef.current = null
						}, 2000)
					} else {
						// Normal mode: show success screen
						setViewState('SUCCESS')
						setTransferProgress(null)
					}

					try {
						const fileSize = await invoke<number>('get_file_size', {
							path: currentPath,
						})
						setTransferMetadata({
							fileName,
							fileSize,
							duration,
							startTime: transferStartTimeRef.current || endTime,
							endTime,
							pathType: currentPathType,
						})
					} catch (error) {
						console.error('Failed to get file size:', error)
					}
				} else {
					setViewState('SUCCESS')
					setTransferProgress(null)
				}
			})

			unlistenFailed = await listen('transfer-failed', async () => {
				if (wasManuallyStoppedRef.current) {
					return
				}

				if (progressUpdateIntervalRef.current) {
					clearInterval(progressUpdateIntervalRef.current)
					progressUpdateIntervalRef.current = null
				}

				setViewState('SUCCESS')
				setTransferProgress(null)

				const endTime = Date.now()
				const duration = transferStartTimeRef.current
					? endTime - transferStartTimeRef.current
					: 0

				const currentPath = selectedPathRef.current
				const currentPathType = pathTypeRef.current
				if (currentPath) {
					const fileName = currentPath.split('/').pop() || 'Unknown'
					setTransferMetadata({
						fileName,
						fileSize: 0,
						duration,
						startTime: transferStartTimeRef.current || endTime,
						endTime,
						wasStopped: true,
						pathType: currentPathType,
					})
				}
			})
		}

		setupListeners().catch((error) => {
			console.error('Failed to set up event listeners:', error)
		})

		return () => {
			if (progressUpdateIntervalRef.current) {
				clearInterval(progressUpdateIntervalRef.current)
			}
			if (unlistenStart) unlistenStart()
			if (unlistenProgress) unlistenProgress()
			if (unlistenComplete) unlistenComplete()
			if (unlistenFailed) unlistenFailed()
		}
	}, [setViewState, setTransferMetadata, setTransferProgress, resetForBroadcast])

	const handleFileSelect = async (path: string) => {
		setSelectedPath(path)
		try {
			const type = await invoke<string>('check_path_type', { path })
			setPathType(type as 'file' | 'directory')
		} catch (error) {
			console.error('Failed to check path type:', error)
			setPathType(null)
		}
	}

	const startSharing = async () => {
		if (!selectedPath) return

		try {
			setViewState('IDLE')
			setTransferMetadata(null)
			setTransferProgress(null)
			transferStartTimeRef.current = null
			wasManuallyStoppedRef.current = false
			latestProgressRef.current = null

			setIsLoading(true)
			const result = await invoke<string>('start_sharing', {
				path: selectedPath,
			})
			setTicket(result)
			setViewState('SHARING')
		} catch (error) {
			console.error('Failed to start sharing:', error)
			showAlert(
				t('common:errors.sharingFailed'),
				`${t('common:errors.sharingFailedDesc')}: ${error}`,
				'error'
			)
		} finally {
			setIsLoading(false)
		}
	}

	const stopSharing = async () => {
		try {
			const wasActiveTransfer =
				viewState === 'TRANSPORTING' &&
				(!transferMetadata || !transferMetadata.wasStopped)
			const isCompletedTransfer = viewState === 'SUCCESS' && transferMetadata

			const currentSelectedPath = selectedPathRef.current
			const currentTransferStartTime = transferStartTimeRef.current

			if (wasActiveTransfer && currentSelectedPath) {
				wasManuallyStoppedRef.current = true

				if (progressUpdateIntervalRef.current) {
					clearInterval(progressUpdateIntervalRef.current)
					progressUpdateIntervalRef.current = null
				}

				const endTime = Date.now()
				const fileName = currentSelectedPath.split('/').pop() || 'Unknown'
				const currentPathType = pathTypeRef.current

				const stoppedMetadata: TransferMetadata = {
					fileName,
					fileSize: 0,
					duration: 0,
					startTime: currentTransferStartTime || endTime,
					endTime,
					wasStopped: true,
					pathType: currentPathType,
				}

				setTransferMetadata(stoppedMetadata)
				setViewState('SUCCESS')
			}

			if (isCompletedTransfer) {
				wasManuallyStoppedRef.current = false
				resetToIdle()
				transferStartTimeRef.current = null

				invoke('stop_sharing').catch((error) => {
					console.warn('Background cleanup failed (non-critical):', error)
				})
				return
			}

			await invoke('stop_sharing')

			// If no active transfer (just sharing, waiting for acceptance), reset to idle
			if (!wasActiveTransfer || !currentSelectedPath) {
				wasManuallyStoppedRef.current = false
				resetToIdle()
				transferStartTimeRef.current = null
				return
			}

			setTicket(null)
			setSelectedPath(null)
			setPathType(null)
			setTransferProgress(null)
			transferStartTimeRef.current = null
		} catch (error) {
			console.error('Failed to stop sharing:', error)
			showAlert(
				t('common:errors.stopSharingFailed'),
				`${t('common:errors.stopSharingFailedDesc')}: ${error}`,
				'error'
			)
		}
	}

	const resetForNewTransfer = async () => {
		await stopSharing()
	}

	const copyTicket = async () => {
		if (ticket) {
			try {
				await navigator.clipboard.writeText(ticket)
				setCopySuccess(true)
				setTimeout(() => setCopySuccess(false), 2000)
			} catch (error) {
				console.error('Failed to copy ticket:', error)
				showAlert(
					t('common:errors.copyFailed'),
					`${t('common:errors.copyFailedDesc')}: ${error}`,
					'error'
				)
			}
		}
	}

	// Derived states for backward compatibility
	const isSharing = viewState === 'SHARING' || viewState === 'TRANSPORTING'
	const isTransporting = viewState === 'TRANSPORTING'
	const isCompleted = viewState === 'SUCCESS'

	return {
		viewState,
		isSharing,
		isTransporting,
		isCompleted,
		ticket,
		selectedPath,
		pathType,
		isLoading,
		copySuccess,
		alertDialog,
		transferMetadata,
		transferProgress,
		isBroadcastMode,

		handleFileSelect,
		startSharing,
		stopSharing,
		copyTicket,
		showAlert,
		closeAlert,
		resetForNewTransfer,
		toggleBroadcastMode,
	}
}
