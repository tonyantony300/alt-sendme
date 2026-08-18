import {
	CheckCircle,
	Copy,
	MonitorSmartphone,
	QrCode,
	Share2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import QRCode from 'react-qr-code'
import { useTranslation } from '../../i18n/react-i18next-compat'
import { IS_MOBILE, IS_WEB } from '../../lib/platform'
import {
	buildReceiveLink,
	formatReceiveShareMessage,
} from '../../lib/receive-link'
import { randomUUID, copyTextToClipboard } from '../../lib/utils'
import { useAppSettingStore } from '../../store/app-setting'
import type { TransferProgress } from '../../types/transfer'
import { PulseAnimation } from '../common/PulseAnimation'
import { TransferProgressBar } from '../common/TransferProgressBar'
import { Button } from '../ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from '../ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { toastManager } from '../ui/toast'
import { SharingActiveHeader } from './SharingActiveHeader'

interface ShareLinkPanelProps {
	selectedPaths: string[]
	selectedPath: string | null
	ticket: string | null
	copySuccess: boolean
	isTransporting: boolean
	isCompleted: boolean
	isBroadcastMode: boolean
	activeConnectionCount: number
	transferProgress: TransferProgress | null
	onCopyTicket: () => Promise<void>
	onSetBroadcast: (broadcast: boolean) => void
	onStopSharing: () => Promise<void>
	showPairedDevicesOption?: boolean
	onOpenPairedDevices?: () => void
}

export function ShareLinkPanel({
	selectedPaths,
	selectedPath,
	ticket,
	copySuccess,
	isTransporting,
	isCompleted,
	isBroadcastMode,
	activeConnectionCount,
	transferProgress,
	onCopyTicket,
	onSetBroadcast,
	onStopSharing,
	showPairedDevicesOption = false,
	onOpenPairedDevices,
}: ShareLinkPanelProps) {
	const { t } = useTranslation()

	const statusText = isCompleted
		? t('common:sender.transferCompleted')
		: isTransporting
			? t('common:sender.sharingInProgress')
			: t('common:sender.listeningForConnection')

	const clampedProgress = transferProgress
		? {
				...transferProgress,
				bytesTransferred: Math.min(
					Math.max(transferProgress.bytesTransferred, 0),
					transferProgress.totalBytes
				),
				percentage: Math.min(Math.max(transferProgress.percentage, 0), 100),
			}
		: null

	const defaultProgress = {
		bytesTransferred: 0,
		totalBytes: 0,
		speedBps: 0,
		percentage: 0,
	}

	const progressToDisplay = isTransporting
		? clampedProgress || defaultProgress
		: null

	const receiveLink = ticket
		? buildReceiveLink(ticket, IS_WEB ? window.location.origin : undefined)
		: ''

	return (
		<div className="flex flex-col gap-5 px-3 pt-3 sm:gap-4 sm:px-0 sm:pt-0">
			<SharingActiveHeader
				selectedPaths={selectedPaths}
				selectedPath={selectedPath}
				statusText={statusText}
				isCompleted={isCompleted}
				isTransporting={isTransporting}
				activeConnectionCount={activeConnectionCount}
				isBroadcastMode={isBroadcastMode}
				onStopSharing={onStopSharing}
			/>

			<div className="flex flex-col items-center gap-3 sm:gap-4">
				<PulseAnimation
					isTransporting={isTransporting && !isBroadcastMode}
					hasActiveConnections={isBroadcastMode && activeConnectionCount > 0}
					size={140}
					className="flex items-center justify-center max-sm:size-[88px]!"
				/>

				<p className="text-xs text-center text-muted-foreground">
					{t('common:sender.keepAppOpen')}
				</p>

				{!isTransporting && ticket && (
					<div className="w-full space-y-3 mt-2 sm:mt-0">
						<TicketDisplay
							ticket={ticket}
							receiveLink={receiveLink}
							copySuccess={copySuccess}
							onCopyTicket={onCopyTicket}
							isBroadcastMode={isBroadcastMode}
							onSetBroadcast={onSetBroadcast}
						/>
						<p className="text-xs text-left text-muted-foreground">
							{t('common:sender.sendThisTicket')}
						</p>
						{showPairedDevicesOption && onOpenPairedDevices ? (
							<div className="flex flex-col items-center gap-3 pt-1">
								<p className="text-xs text-center text-muted-foreground">
									{t('common:sender.sharingActive.or')}
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={onOpenPairedDevices}
								>
									<MonitorSmartphone className="h-4 w-4" />
									{t('common:sender.sharingActive.devicesButton')}
								</Button>
							</div>
						) : null}
					</div>
				)}

				{progressToDisplay && (
					<div className="w-full">
						<TransferProgressBar progress={progressToDisplay} />
					</div>
				)}
			</div>
		</div>
	)
}

interface TicketDisplayProps {
	ticket: string
	receiveLink: string
	copySuccess: boolean
	onCopyTicket: () => Promise<void>
	isBroadcastMode: boolean
	onSetBroadcast: (broadcast: boolean) => void
}

function TicketDisplay({
	ticket,
	receiveLink,
	copySuccess,
	onCopyTicket,
	isBroadcastMode,
	onSetBroadcast,
}: TicketDisplayProps) {
	const { t } = useTranslation()
	const [linkCopySuccess, setLinkCopySuccess] = useState(false)
	const [qrDialogOpen, setQrDialogOpen] = useState(false)
	const linkCopyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const showBroadcastToggle = useAppSettingStore(
		(state) => state.showBroadcastToggle
	)

	useEffect(
		() => () => {
			if (linkCopyTimer.current) clearTimeout(linkCopyTimer.current)
		},
		[]
	)

	const handleBroadcastChange = (next: boolean) => {
		onSetBroadcast(next)
		if (next) {
			const toastId = randomUUID()
			toastManager.add({
				title: t('common:sender.broadcastMode.on.label'),
				id: toastId,
				description: t('common:sender.broadcastMode.on.description'),
				type: 'info',
				actionProps: {
					children: t('common:undo'),
					onClick: () => {
						onSetBroadcast(false)
						toastManager.close(toastId)
					},
				},
			})
			setTimeout(() => {
				toastManager.close(toastId)
			}, 5000)
		}
	}

	const canNativeShare =
		typeof navigator !== 'undefined' &&
		typeof navigator.share === 'function' &&
		(IS_MOBILE ||
			(IS_WEB &&
				(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
					(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))))

	const shareTicket = async () => {
		const url = receiveLink
		const intro = t('common:sender.shareMessageIntro')
		const shareMessage = formatReceiveShareMessage(intro, url)
		try {
			if (canNativeShare) {
				// Keep `url` as its own field so the OS/share target can still
				// render the receive-link preview; brand stays in title/text.
				await navigator.share({ title: intro, text: intro, url })
			} else {
				await copyTextToClipboard(shareMessage)
				setLinkCopySuccess(true)
				if (linkCopyTimer.current) clearTimeout(linkCopyTimer.current)
				linkCopyTimer.current = setTimeout(
					() => setLinkCopySuccess(false),
					2000
				)
			}
		} catch (error) {
			if ((error as DOMException).name !== 'AbortError') {
				console.error('Failed to share receive link:', error)
				toastManager.add({
					title: t('common:errors.sharingFailed'),
					description: String(error),
					type: 'error',
				})
			}
		}
	}

	const actionButtonStyle = (active: boolean) => ({
		backgroundColor: active ? 'var(--app-primary)' : 'var(--color-foreground)',
		border: '1px solid var(--border)',
	})

	return (
		<div className="w-full space-y-2.5">
			<div className="flex items-center justify-between gap-3">
				<p className="block text-sm font-medium">
					{t('common:sender.shareThisTicket')}
				</p>
				{showBroadcastToggle && (
					<div className="flex items-start gap-2">
						<Label htmlFor="broadcast-toggle" className="text-sm">
							{t('common:sender.broadcastMode.index')}
						</Label>
						<Switch
							id="broadcast-toggle"
							checked={isBroadcastMode}
							onCheckedChange={handleBroadcastChange}
						/>
					</div>
				)}
			</div>
			<InputGroup>
				<InputGroupInput
					type="text"
					value={ticket}
					size="sm"
					className="text-ellipsis text-sm"
					readOnly
				/>
				<InputGroupAddon align="inline-end">
					<Button
						type="button"
						size="icon-xs"
						onClick={() => setQrDialogOpen(true)}
						style={actionButtonStyle(false)}
						title={t('common:sender.showReceiveQr')}
					>
						<QrCode className="h-3.5 w-3.5" />
					</Button>
					<Button
						type="button"
						size="icon-xs"
						onClick={() => void shareTicket()}
						style={actionButtonStyle(linkCopySuccess)}
						title={t(
							canNativeShare
								? 'common:sender.shareReceiveLink'
								: 'common:sender.copyReceiveLink'
						)}
					>
						{linkCopySuccess ? (
							<CheckCircle className="h-3.5 w-3.5" />
						) : (
							<Share2 className="h-3.5 w-3.5" />
						)}
					</Button>
					<Button
						type="button"
						size="icon-xs"
						onClick={onCopyTicket}
						style={actionButtonStyle(copySuccess)}
						title={t('common:sender.copyToClipboard')}
					>
						{copySuccess ? (
							<CheckCircle className="h-3.5 w-3.5" />
						) : (
							<Copy className="h-3.5 w-3.5" />
						)}
					</Button>
				</InputGroupAddon>
			</InputGroup>

			<Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
				<DialogContent className="max-w-sm" showCloseButton={false} centered>
					<div className="flex flex-col items-center gap-4 p-8 text-center">
						<DialogTitle>{t('common:sender.receiveQrTitle')}</DialogTitle>
						<div className="rounded-xl bg-white p-3 shadow-sm">
							<QRCode
								value={receiveLink}
								size={220}
								title={t('common:sender.scanToReceive')}
							/>
						</div>
						<DialogDescription>
							{t('common:sender.scanToReceive')}
						</DialogDescription>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
