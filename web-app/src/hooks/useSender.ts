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
		console.log('[useSender] selectedPath changed, updating ref:', {
			from: selectedPathRef.current,
			to: selectedPath,
			currentViewState: useSenderStore.getState().viewState,
		})
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
				const storeState = useSenderStore.getState()
				console.log('[useSender] transfer-started event received:', {
					currentViewState: storeState.viewState,
					selectedPath: selectedPathRef.current,
					isBroadcastMode: storeState.isBroadcastMode,
				})

				transferStartTimeRef.current = Date.now()
				latestProgressRef.current = null
				speedAveragerRef.current.reset()

				// In broadcast mode, stay in SHARING state instead of transitioning to TRANSPORTING
				if (storeState.isBroadcastMode) {
					console.log('[useSender] transfer-started: broadcast mode - staying in SHARING state')
					setTransferProgress(null)
					setTransferMetadata(null)
					wasManuallyStoppedRef.current = false

					if (progressUpdateIntervalRef.current) {
						clearInterval(progressUpdateIntervalRef.current)
					}
					progressUpdateIntervalRef.current = setInterval(() => {
						const currentViewState = useSenderStore.getState().viewState
						if (latestProgressRef.current && currentViewState === 'SHARING') {
							setTransferProgress(latestProgressRef.current)
						}
					}, 50)
				} else {
					console.log('[useSender] transfer-started: setting state to TRANSPORTING')
					setViewState('TRANSPORTING')
					setTransferProgress(null)
					setTransferMetadata(null)
					wasManuallyStoppedRef.current = false

					if (progressUpdateIntervalRef.current) {
						clearInterval(progressUpdateIntervalRef.current)
					}
					progressUpdateIntervalRef.current = setInterval(() => {
						const currentViewState = useSenderStore.getState().viewState
						if (latestProgressRef.current && currentViewState === 'TRANSPORTING') {
							setTransferProgress(latestProgressRef.current)
						}
					}, 50)
				}
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
				const storeState = useSenderStore.getState()
				console.log('[useSender] transfer-completed event received:', {
					wasManuallyStopped: wasManuallyStoppedRef.current,
					currentViewState: storeState.viewState,
					selectedPath: selectedPathRef.current,
					storeSelectedPath: storeState.selectedPath,
					hasLatestProgress: !!latestProgressRef.current,
				})

				// Guard: Skip if manually stopped
				if (wasManuallyStoppedRef.current) {
					console.log('[useSender] transfer-completed: skipping (was manually stopped)')
					return
				}

				// Guard: Skip if already reset to IDLE (delayed event after reset)
				if (storeState.viewState === 'IDLE') {
					console.log('[useSender] transfer-completed: skipping (already in IDLE state - likely delayed event after reset)')
					return
				}

				// Guard: Skip if selectedPath is null in store (already reset)
				if (!storeState.selectedPath) {
					console.log('[useSender] transfer-completed: skipping (selectedPath is null in store - already reset)')
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
				const currentBroadcastMode = storeState.isBroadcastMode
				
				console.log('[useSender] transfer-completed: processing:', {
					currentPath,
					currentPathType,
					currentBroadcastMode,
					duration,
					storeSelectedPath: storeState.selectedPath,
					storeViewState: storeState.viewState,
					storeHasMetadata: !!storeState.transferMetadata,
					refVsStoreMatch: currentPath === storeState.selectedPath,
				})

				// Use store's selectedPath as source of truth (not the ref)
				const pathToUse = storeState.selectedPath || currentPath
				if (pathToUse) {
					const fileName = pathToUse.split('/').pop() || 'Unknown'
					const estimatedFileSize = latestProgressRef.current?.totalBytes || 0
					const pathTypeToUse = storeState.pathType || currentPathType

					console.log('[useSender] transfer-completed: setting initial metadata:', {
						fileName,
						estimatedFileSize,
					})

					setTransferMetadata({
						fileName,
						fileSize: estimatedFileSize,
						duration,
						startTime: transferStartTimeRef.current || endTime,
						endTime,
						pathType: pathTypeToUse,
					})

					// Check if broadcast mode is enabled
					if (currentBroadcastMode) {
						console.log('[useSender] transfer-completed: broadcast mode - will reset after delay')
						// In broadcast mode: reset to listening state after a brief delay
						setTimeout(() => {
							console.log('[useSender] transfer-completed: broadcast mode timeout - resetting')
							resetForBroadcast()
							latestProgressRef.current = null
							transferStartTimeRef.current = null
						}, 2000)
					} else {
						console.log('[useSender] transfer-completed: normal mode - setting SUCCESS state')
						// Normal mode: show success screen
						setViewState('SUCCESS')
						setTransferProgress(null)
					}

					try {
						const fileSize = await invoke<number>('get_file_size', {
							path: pathToUse,
						})
						console.log('[useSender] transfer-completed: got file size, updating metadata:', {
							fileSize,
							currentViewState: useSenderStore.getState().viewState,
						})
						setTransferMetadata({
							fileName,
							fileSize,
							duration,
							startTime: transferStartTimeRef.current || endTime,
							endTime,
							pathType: pathTypeToUse,
						})
					} catch (error) {
						console.error('[useSender] transfer-completed: failed to get file size:', error)
					}
				} else {
					// This should never happen now due to guards above, but log if it does
					console.error('[useSender] transfer-completed: ⚠️ NO PATH AVAILABLE - this should not happen due to guards!', {
						selectedPathRef: selectedPathRef.current,
						storeSelectedPath: storeState.selectedPath,
						storeViewState: storeState.viewState,
						storeHasMetadata: !!storeState.transferMetadata,
						wasManuallyStopped: wasManuallyStoppedRef.current,
						stackTrace: new Error().stack,
					})
					// Don't set SUCCESS without metadata - just log the error
					// The guards above should prevent this path from being reached
				}
			})

			unlistenFailed = await listen('transfer-failed', async () => {
				const storeState = useSenderStore.getState()
				console.log('[useSender] transfer-failed event received:', {
					wasManuallyStopped: wasManuallyStoppedRef.current,
					currentViewState: storeState.viewState,
					selectedPath: selectedPathRef.current,
					storeSelectedPath: storeState.selectedPath,
					isBroadcastMode: storeState.isBroadcastMode,
				})

				// Guard: Skip if manually stopped
				if (wasManuallyStoppedRef.current) {
					console.log('[useSender] transfer-failed: skipping (was manually stopped)')
					return
				}

				// Guard: Skip if already reset to IDLE (delayed event after reset)
				if (storeState.viewState === 'IDLE') {
					console.log('[useSender] transfer-failed: skipping (already in IDLE state - likely delayed event after reset)')
					return
				}

				// Guard: Skip if selectedPath is null in store (already reset)
				if (!storeState.selectedPath) {
					console.log('[useSender] transfer-failed: skipping (selectedPath is null in store - already reset)')
					return
				}

				if (progressUpdateIntervalRef.current) {
					clearInterval(progressUpdateIntervalRef.current)
					progressUpdateIntervalRef.current = null
				}

				const currentPath = selectedPathRef.current
				const currentPathType = pathTypeRef.current
				const pathToUse = storeState.selectedPath || currentPath
				const pathTypeToUse = storeState.pathType || currentPathType
				
				// In broadcast mode, reset to SHARING instead of showing SUCCESS
				if (storeState.isBroadcastMode) {
					console.log('[useSender] transfer-failed: broadcast mode - resetting to SHARING')
					resetForBroadcast()
					latestProgressRef.current = null
					transferStartTimeRef.current = null
					return
				}

				console.log('[useSender] transfer-failed: setting SUCCESS state:', {
					currentPath,
					pathToUse,
					pathTypeToUse,
				})

				const endTime = Date.now()
				const duration = transferStartTimeRef.current
					? endTime - transferStartTimeRef.current
					: 0

				if (pathToUse) {
					const fileName = pathToUse.split('/').pop() || 'Unknown'
					console.log('[useSender] transfer-failed: setting metadata:', {
						fileName,
						wasStopped: true,
					})
					setTransferMetadata({
						fileName,
						fileSize: 0,
						duration,
						startTime: transferStartTimeRef.current || endTime,
						endTime,
						wasStopped: true,
						pathType: pathTypeToUse,
					})
					setViewState('SUCCESS')
					setTransferProgress(null)
				} else {
					console.warn('[useSender] transfer-failed: NO PATH AVAILABLE - this should not happen due to guards!')
					// Don't set SUCCESS without metadata - guards should prevent this
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
		console.log('[useSender] startSharing called:', {
			selectedPath,
			currentViewState: viewState,
			hasTransferMetadata: !!transferMetadata,
		})

		if (!selectedPath) {
			console.warn('[useSender] startSharing: no selectedPath, returning early')
			return
		}

		try {
			console.log('[useSender] startSharing: resetting state to IDLE')
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
			console.log('[useSender] startSharing: got ticket, setting state to SHARING')
			setTicket(result)
			setViewState('SHARING')
		} catch (error) {
			console.error('[useSender] startSharing: failed:', error)
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
		console.log('[useSender] stopSharing called:', {
			currentViewState: viewState,
			hasTransferMetadata: !!transferMetadata,
			transferMetadataWasStopped: transferMetadata?.wasStopped,
			selectedPath: selectedPathRef.current,
			storeSelectedPath: selectedPath,
		})

		// Always disable broadcast mode when stopping
		setIsBroadcastMode(false)

		try {
			const wasActiveTransfer =
				viewState === 'TRANSPORTING' &&
				(!transferMetadata || !transferMetadata.wasStopped)
			const isCompletedTransfer = viewState === 'SUCCESS' && transferMetadata

			console.log('[useSender] stopSharing: conditions:', {
				wasActiveTransfer,
				isCompletedTransfer,
				viewState,
				hasTransferMetadata: !!transferMetadata,
			})

			const currentSelectedPath = selectedPathRef.current
			const currentTransferStartTime = transferStartTimeRef.current
			const storeState = useSenderStore.getState()

			if (wasActiveTransfer && currentSelectedPath) {
				// In broadcast mode, reset to SHARING instead of showing SUCCESS
				if (storeState.isBroadcastMode) {
					console.log('[useSender] stopSharing: active transfer in broadcast mode - resetting to SHARING')
					wasManuallyStoppedRef.current = true

					if (progressUpdateIntervalRef.current) {
						clearInterval(progressUpdateIntervalRef.current)
						progressUpdateIntervalRef.current = null
					}

					resetForBroadcast()
					latestProgressRef.current = null
					transferStartTimeRef.current = null
				} else {
					console.log('[useSender] stopSharing: active transfer detected - setting SUCCESS with stopped metadata')
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
			}

			if (isCompletedTransfer) {
				console.log('[useSender] stopSharing: completed transfer - resetting to idle')
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
				console.log('[useSender] stopSharing: no active transfer - resetting to idle')
				wasManuallyStoppedRef.current = false
				resetToIdle()
				transferStartTimeRef.current = null
				return
			}

			console.log('[useSender] stopSharing: clearing transfer state')
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
		console.log('[useSender] resetForNewTransfer called')
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
