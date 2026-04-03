import { CheckCircle, Copy, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { SharingControlsProps } from '../../types/sender'
import { TransferProgressBar } from '../common/TransferProgressBar'
import { StatusIndicator } from '../common/StatusIndicator'
import { Button } from '../ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { toastManager } from '../ui/toast'

export function SharingActiveCard({
	selectedPath,
	pathType,
	ticket,
	transferProgress,
	isTransporting,
	isCompleted,
	isBroadcastMode,
	activeConnectionCount = 0,
	onStopSharing,
	onSetBroadcast: _onSetBroadcast,
}: Omit<SharingControlsProps, 'copySuccess' | 'onCopyTicket'>) {
	const { t } = useTranslation()
	const onSetBroadcast = () => {
		if (_onSetBroadcast) {
			const isTurningOn = !isBroadcastMode
			_onSetBroadcast(isTurningOn)
			// Only show toast notification when turning broadcast mode ON, not for private sharing
			if (isTurningOn) {
				const toastId = crypto.randomUUID()
				toastManager.add({
					title: t('common:sender.broadcastMode.on.label'),
					id: toastId,
					description: t('common:sender.broadcastMode.on.description'),
					type: 'info',
					actionProps: {
						children: t('common:undo'),
						onClick: () => {
							_onSetBroadcast?.(false)
							toastManager.close(toastId)
						},
					},
				})
				// Auto-close "You are broadcasting" notification after 1 seconds
				setTimeout(() => {
					toastManager.close(toastId)
				}, 5000)
			}
		}
	}

	const getStatusText = () => {
		if (isCompleted) return t('common:sender.transferCompleted')
		if (isTransporting) return t('common:sender.sharingInProgress')
		return t('common:sender.listeningForConnection')
	}

	const statusText = getStatusText()

	const [cumulativeBytesTransferred, setCumulativeBytesTransferred] =
		useState(0)
	const [transferStartTime, setTransferStartTime] = useState<number | null>(
		null
	)
	const previousBytesRef = useRef<number>(0)
	const maxBytesRef = useRef<number>(0)
	const isFolderTransfer = pathType === 'directory' && isTransporting

	useEffect(() => {
		if (isTransporting && pathType === 'directory') {
			setCumulativeBytesTransferred(0)
			setTransferStartTime(Date.now())
			previousBytesRef.current = 0
			maxBytesRef.current = 0
		}
	}, [isTransporting, pathType])

	useEffect(() => {
		if (
			isFolderTransfer &&
			typeof transferProgress?.bytesTransferred !== 'undefined'
		) {
			const currentBytes = transferProgress.bytesTransferred
			const previousBytes = previousBytesRef.current
			const maxBytes = maxBytesRef.current

			if (currentBytes > maxBytes) {
				maxBytesRef.current = currentBytes
			}

			if (
				previousBytes > 0 &&
				currentBytes < previousBytes * 0.5 &&
				maxBytes > 0
			) {
				setCumulativeBytesTransferred((prev) => prev + maxBytes)
				maxBytesRef.current = currentBytes
				previousBytesRef.current = currentBytes
			} else if (currentBytes === 0 && previousBytes > 0 && maxBytes > 0) {
				setCumulativeBytesTransferred((prev) => prev + maxBytes)
				maxBytesRef.current = 0
				previousBytesRef.current = 0
			} else if (currentBytes > previousBytes) {
				previousBytesRef.current = currentBytes
			} else if (
				currentBytes < previousBytes &&
				currentBytes >= previousBytes * 0.5
			) {
				previousBytesRef.current = currentBytes
			}
		}
	}, [isFolderTransfer, transferProgress?.bytesTransferred])

	const totalTransferredBytes =
		isFolderTransfer && transferProgress
			? cumulativeBytesTransferred + transferProgress.bytesTransferred
			: (transferProgress?.bytesTransferred ?? 0)

	const [calculatedSpeed, setCalculatedSpeed] = useState(0)

	useEffect(() => {
		if (isFolderTransfer && transferProgress && transferStartTime) {
			const updateSpeed = () => {
				const elapsed = (Date.now() - transferStartTime) / 1000.0
				const speed = elapsed > 0 ? totalTransferredBytes / elapsed : 0
				setCalculatedSpeed(speed)
			}

			updateSpeed()
			const interval = setInterval(updateSpeed, 500)
			return () => clearInterval(interval)
		} else if (transferProgress) {
			setCalculatedSpeed(transferProgress.speedBps)
		} else {
			setCalculatedSpeed(0)
		}
	}, [
		isFolderTransfer,
		transferProgress,
		transferStartTime,
		totalTransferredBytes,
	])

	// Calculate percentage and create progress object for folders
	const folderProgress =
		isFolderTransfer && transferProgress
			? {
					bytesTransferred: totalTransferredBytes,
					totalBytes: transferProgress.totalBytes,
					speedBps: calculatedSpeed,
					percentage:
						transferProgress.totalBytes > 0
							? (totalTransferredBytes / transferProgress.totalBytes) * 100
							: 0,
				}
			: null

	// Default progress object when transferProgress is not yet available
	const defaultProgress = {
		bytesTransferred: 0,
		totalBytes: 0,
		speedBps: 0,
		percentage: 0,
	}

	// Determine which progress object to use
	const progressToDisplay = isTransporting
		? folderProgress || transferProgress || defaultProgress
		: null

	return (
		<div className="space-y-4">
			<div className="p-4 rounded-lg absolute top-0 left-0">
				<p className="text-xs mb-4 max-w-40 sm:max-w-120 truncate">
					<strong className="mr-1">{t('common:sender.fileLabel')}</strong>{' '}
					{selectedPath?.split('/').pop()}
				</p>

				<StatusIndicator
					isCompleted={isCompleted}
					isTransporting={isTransporting}
					statusText={statusText}
					activeConnectionCount={activeConnectionCount}
					isBroadcastMode={isBroadcastMode}
				/>
			</div>

			<p className="text-xs text-center">{t('common:sender.keepAppOpen')}</p>

			{!isTransporting && ticket && (
				<TicketDisplay
					ticket={ticket}
					isBroadcastMode={isBroadcastMode}
					onSetBroadcast={onSetBroadcast}
				/>
			)}

			{isTransporting && progressToDisplay && (
				<TransferProgressBar progress={progressToDisplay} />
			)}

			<Button
				size="icon-lg"
				type="button"
				onClick={onStopSharing}
				variant="destructive-outline"
				className="absolute top-0 right-0 sm:right-6 rounded-full font-medium transition-colors not-disabled:not-active:not-data-pressed:before:shadow-none dark:not-disabled:before:shadow-none dark:not-disabled:not-active:not-data-pressed:before:shadow-none"
				aria-label="Stop sharing"
			>
				<Square className="w-4 h-4" fill="currentColor" />
			</Button>
		</div>
	)
}

export function TicketDisplay({
	ticket,
	isBroadcastMode,
	onSetBroadcast,
}: {
	ticket: string
	isBroadcastMode?: boolean
	onSetBroadcast?: (broadcast: boolean) => void
}) {
	const { t } = useTranslation()
	const [copySchemeSuccess, setCopySchemeSuccess] = useState(false)
	const [copyTicketSuccess, setCopyTicketSuccess] = useState(false)

	// Generate scheme URI
	const schemeURI = `sendme://receive?ticket=${encodeURIComponent(ticket)}`

	// Copy scheme URI to clipboard
	const handleCopySchemeURI = async () => {
		try {
			await navigator.clipboard.writeText(schemeURI)
			setCopySchemeSuccess(true)
			setTimeout(() => setCopySchemeSuccess(false), 2000)
		} catch (error) {
			console.error('Failed to copy scheme URI:', error)
		}
	}

	// Copy original ticket to clipboard
	const handleCopyTicket = async () => {
		try {
			await navigator.clipboard.writeText(ticket)
			setCopyTicketSuccess(true)
			setTimeout(() => setCopyTicketSuccess(false), 2000)
		} catch (error) {
			console.error('Failed to copy ticket:', error)
		}
	}

	return (
		<div className="space-y-5">
			{/* Header with broadcast toggle */}
			<div className="flex items-center justify-between">
				{/* <p className="block text-sm font-medium">
          {t("common:sender.shareThisTicket")}
        </p> */}
				<div className="flex items-center gap-2">
					<p className="text-sm font-medium">Ticket: </p>
					<Button
						type="button"
						onClick={handleCopyTicket}
						variant="outline"
						className="flex items-center justify-center gap-2"
					>
						{copyTicketSuccess ? (
							<CheckCircle className="h-4 w-4" />
						) : (
							<Copy className="h-4 w-4" />
						)}
					</Button>
				</div>
				{isBroadcastMode !== undefined && onSetBroadcast && (
					<div className="flex items-start gap-2">
						<Label htmlFor={'broadcast-toggle'} className="text-sm">
							{t('common:sender.broadcastMode.index')}
						</Label>
						<Switch
							checked={isBroadcastMode}
							onCheckedChange={onSetBroadcast}
						/>
					</div>
				)}
			</div>

			{/* Scheme URI Section */}
			<div className="space-y-2">
				<p className="text-sm font-medium block">
					{t('common:sender.deepLinkURI')}
				</p>
				<InputGroup>
					<InputGroupInput
						type="text"
						value={schemeURI}
						className="overflow-ellipsis text-xs"
						readOnly
					/>
					<InputGroupAddon align="inline-end">
						<Button
							type="button"
							size="icon-xs"
							onClick={handleCopySchemeURI}
							style={{
								backgroundColor: copySchemeSuccess
									? 'var(--app-primary)'
									: 'var(--color-foreground)',
								border: '1px solid var(--border)',
							}}
							title="Copy URI"
						>
							{copySchemeSuccess ? (
								<CheckCircle className="h-4 w-4" />
							) : (
								<Copy className="h-4 w-4" />
							)}
						</Button>
					</InputGroupAddon>
				</InputGroup>
			</div>
		</div>
	)
}
