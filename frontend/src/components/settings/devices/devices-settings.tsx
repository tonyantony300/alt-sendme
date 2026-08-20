import { useEffect, useMemo, useState } from 'react'
import { Copy, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { usePairing } from '../../../hooks/usePairing'
import { Button } from '../../ui/button'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../../ui/alert-dialog'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { toastManager } from '../../ui/toast'
import { Frame, FrameDescription, FramePanel, FrameTitle } from '../../ui/frame'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import {
	deviceSubtitle,
	isPairedDeviceActive,
	matchesPairedDeviceSearch,
	sortPairedDevicesForSettings,
} from '@/lib/pairing-api'
import { getPairedSendCounts } from '@/lib/paired-send-counts'
import { deviceTypeIcon } from '@/lib/device-icon'
import { copyTextToClipboard } from '@/lib/utils'
import { DevicePairingStatus } from '../../pairing/DevicePairingStatus'
import { NearbyDevices } from '../../pairing/NearbyDevices'
import { PairedDevicesSearchField } from '../../pairing/PairedDevicesSearchField'

function PairJoinModal({
	open,
	isLoading,
	onClose,
	onJoin,
}: {
	open: boolean
	isLoading: boolean
	onClose: () => void
	onJoin: (ticket: string) => Promise<void>
}) {
	const { t } = useTranslation()
	const [code, setCode] = useState('')

	const handleJoin = async () => {
		if (!code.trim()) return
		try {
			await onJoin(code)
			setCode('')
			onClose()
			toastManager.add({
				title: t('common:settings.devices.devicePaired'),
				type: 'success',
			})
		} catch (error) {
			console.error(error)
			toastManager.add({
				title: t('common:settings.devices.pairFailed'),
				type: 'error',
			})
		}
	}

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					setCode('')
					onClose()
				}
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t('common:settings.devices.enterCode')}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t('common:settings.devices.joinHint')}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="px-6 pb-6">
					<Input
						value={code}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							setCode(event.target.value)
						}
						placeholder={t('common:settings.devices.codePlaceholder')}
						className="font-mono text-xs"
					/>
				</div>
				<AlertDialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						{t('common:cancel')}
					</Button>
					<Button
						type="button"
						disabled={isLoading || !code.trim()}
						onClick={handleJoin}
					>
						{isLoading ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								{t('common:settings.devices.pairing')}
							</>
						) : (
							t('common:settings.devices.pairDevice')
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

function RenameDeviceModal({
	open,
	title,
	description,
	initialName,
	onClose,
	onSave,
}: {
	open: boolean
	title: string
	description: string
	initialName: string
	onClose: () => void
	onSave: (name: string) => Promise<void>
}) {
	const { t } = useTranslation()
	const [name, setName] = useState(initialName)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (open) setName(initialName)
	}, [open, initialName])

	const handleSave = async () => {
		const trimmed = name.trim()
		if (!trimmed) return
		setSaving(true)
		try {
			await onSave(trimmed)
			onClose()
			toastManager.add({
				title: t('common:settings.devices.nameSaved'),
				type: 'success',
			})
		} catch (error) {
			console.error(error)
			toastManager.add({
				title: t('common:settings.devices.nameSaveFailed'),
				type: 'error',
			})
		} finally {
			setSaving(false)
		}
	}

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				if (!next) onClose()
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="px-6 pb-6">
					<Label htmlFor="device-display-name">
						{t('common:settings.devices.deviceName')}
					</Label>
					<Input
						id="device-display-name"
						value={name}
						maxLength={64}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							setName(event.target.value)
						}
						placeholder={t('common:settings.devices.deviceNamePlaceholder')}
						className="mt-2"
						autoFocus
					/>
				</div>
				<AlertDialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						{t('common:cancel')}
					</Button>
					<Button
						type="button"
						disabled={saving || !name.trim()}
						onClick={handleSave}
					>
						{t('common:settings.devices.saveName')}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

export function DevicesSettings() {
	const { t } = useTranslation()
	const {
		devices,
		thisDevice,
		pairingCode,
		pairingTicket,
		hostExpiresIn,
		isJoining,
		isLoading,
		hostPairedCount,
		isNodeReady,
		isPairingDataPending,
		nodeStatus,
		openHostPairing,
		closeHostPairing,
		join,
		forget,
		renameThisDevice,
		renameDevice,
	} = usePairing()
	const [joinOpen, setJoinOpen] = useState(false)
	const [renameThisOpen, setRenameThisOpen] = useState(false)
	const [renamePeerId, setRenamePeerId] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	// Removing a device waits on delivering `Forget` to the peer, which can
	// take seconds when the peer is listed online but has actually gone away.
	// Keyed by endpoint id rather than a single flag so removing one device
	// doesn't freeze the buttons on all the others.
	const [forgettingIds, setForgettingIds] = useState<ReadonlySet<string>>(
		new Set()
	)
	const [copied, setCopied] = useState(false)

	const sortedDevices = useMemo(
		() => sortPairedDevicesForSettings(devices, getPairedSendCounts()),
		[devices]
	)

	const filteredDevices = useMemo(
		() =>
			sortedDevices.filter((device) =>
				matchesPairedDeviceSearch(device, searchQuery)
			),
		[sortedDevices, searchQuery]
	)

	// When a peer joins our open pairing window, confirm success instead of
	// leaving the host countdown looking active after the backend closed it.
	useEffect(() => {
		if (hostPairedCount === 0) return
		toastManager.add({
			title: t('common:settings.devices.devicePaired'),
			type: 'success',
		})
	}, [hostPairedCount, t])

	if (!IS_PAIRING_CAPABLE) {
		return (
			<Frame>
				<FramePanel>
					<div className="space-y-2">
						<FrameTitle>{t('common:settings.devices.title')}</FrameTitle>
						<FrameDescription>
							{t('common:settings.devices.desktopOnly')}
						</FrameDescription>
					</div>
				</FramePanel>
			</Frame>
		)
	}

	const copyPairingCode = async () => {
		try {
			const code = pairingCode ?? pairingTicket
			if (code) {
				await copyTextToClipboard(code)
				setCopied(true)
				window.setTimeout(() => setCopied(false), 2000)
				// Open the pairing window in the background — never block copy.
				void openHostPairing().catch((error) => {
					console.error(error)
					toastManager.add({
						title: t('common:settings.devices.pairFailed'),
						type: 'error',
					})
				})
				return
			}

			// Code not hydrated yet: generate + open host, then copy.
			const ticket = await openHostPairing()
			if (!ticket) return
			await copyTextToClipboard(ticket)
			setCopied(true)
			window.setTimeout(() => setCopied(false), 2000)
		} catch (error) {
			console.error(error)
			toastManager.add({
				title: t('common:settings.devices.pairFailed'),
				type: 'error',
			})
		}
	}

	const cancelHost = async () => {
		await closeHostPairing()
	}

	const renamePeer = devices.find((d) => d.endpoint_id === renamePeerId)
	const ThisDeviceIcon = deviceTypeIcon(thisDevice?.device_type)
	const readyToPaint = !isPairingDataPending
	const displayPairingCode = pairingCode ?? pairingTicket
	const hostWindowOpen =
		hostExpiresIn != null && hostExpiresIn > 0 && !!pairingTicket

	return (
		<div className="flex flex-col gap-4">
			{!readyToPaint ? (
				<div role="status" aria-busy="true" aria-label={t('common:loading')}>
					<Frame>
						<FramePanel className="flex flex-col gap-6 min-h-48">
							<div className="space-y-2">
								<FrameTitle>{t('common:settings.devices.title')}</FrameTitle>
								<FrameDescription>
									{t('common:settings.devices.description')}
								</FrameDescription>
							</div>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Loader2 className="h-4 w-4 animate-spin" />
								{t('common:loading')}
							</div>
						</FramePanel>
					</Frame>
				</div>
			) : !isNodeReady ? (
				<Frame>
					<FramePanel>
						<div className="space-y-2">
							<FrameTitle>{t('common:settings.devices.title')}</FrameTitle>
							<FrameDescription>
								{t('common:settings.devices.nodeUnavailableTitle')}
							</FrameDescription>
							<p className="text-sm text-muted-foreground">
								{nodeStatus.reason
									? nodeStatus.reason
									: t('common:settings.devices.nodeUnavailableHint')}
							</p>
						</div>
					</FramePanel>
				</Frame>
			) : (
				<>
					{thisDevice ? (
						<Frame>
							<FramePanel className="flex flex-col gap-4">
								<div className="space-y-1">
									<FrameTitle>
										{t('common:settings.devices.thisDevice')}
									</FrameTitle>
									<FrameDescription>
										{t('common:settings.devices.thisDeviceHint')}
									</FrameDescription>
								</div>
								{/* Mobile: stacked. Desktop: name left, pairing code title+code right. */}
								<div className="flex min-w-0 flex-col gap-3 overflow-hidden sm:flex-row sm:items-start sm:justify-between sm:gap-4">
									<div className="flex min-w-0 items-start gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
											<ThisDeviceIcon className="h-5 w-5" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex min-w-0 items-center gap-1">
												<p className="min-w-0 truncate font-medium">
													{thisDevice.display_name}
												</p>
												<Button
													type="button"
													variant="ghost"
													size="icon-xs"
													className="shrink-0 text-muted-foreground"
													aria-label={t('common:settings.devices.rename')}
													onClick={() => setRenameThisOpen(true)}
												>
													<Pencil className="size-3" />
												</Button>
											</div>
											<p className="min-w-0 truncate text-xs text-muted-foreground">
												{deviceSubtitle(thisDevice)}
											</p>
										</div>
									</div>
									<div className="flex min-w-0 flex-col gap-1 sm:items-end">
										<p className="shrink-0 font-medium">
											{t('common:settings.devices.pairingCode')}
										</p>
										<div className="flex min-w-0 items-center gap-1.5">
											{displayPairingCode ? (
												<span
													className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground sm:max-w-64 sm:flex-none sm:text-right"
													title={displayPairingCode}
												>
													{displayPairingCode}
												</span>
											) : null}
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												className="shrink-0 text-muted-foreground sm:size-6"
												disabled={isLoading}
												aria-label={
													copied
														? t('common:settings.devices.copied')
														: t('common:sender.copyToClipboard')
												}
												onClick={copyPairingCode}
											>
												{isLoading && !displayPairingCode ? (
													<Loader2 className="size-4 animate-spin sm:size-3" />
												) : (
													<Copy className="size-4 sm:size-3" />
												)}
											</Button>
										</div>
									</div>
								</div>

								{hostWindowOpen ? (
									<div className="flex flex-wrap items-center justify-between gap-2 text-sm">
										<p className="text-muted-foreground">
											{t('common:settings.devices.hostStillOpen', {
												seconds: hostExpiresIn,
											})}
										</p>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											onClick={cancelHost}
										>
											{t('common:settings.devices.cancelPairing')}
										</Button>
									</div>
								) : null}
							</FramePanel>
						</Frame>
					) : null}

					<Frame>
						<FramePanel className="flex flex-col gap-6">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div className="space-y-2 min-w-0">
									<FrameTitle>{t('common:settings.devices.title')}</FrameTitle>
									<FrameDescription>
										{t('common:settings.devices.description')}
									</FrameDescription>
								</div>
								<Button
									type="button"
									size="sm"
									variant="outline"
									className="shrink-0"
									onClick={() => setJoinOpen(true)}
								>
									<Plus className="w-4 h-4 mr-2" />
									{t('common:settings.devices.enterCode')}
								</Button>
							</div>

							{sortedDevices.length === 0 ? (
								<div className="py-8 text-center text-sm text-muted-foreground border-t">
									<p className="font-medium text-foreground mb-2">
										{t('common:settings.devices.noPairedDevices')}
									</p>
									<p>{t('common:settings.devices.noPairedDevicesHint')}</p>
								</div>
							) : (
								<div className="space-y-3 border-t pt-4">
									<PairedDevicesSearchField
										value={searchQuery}
										onChange={setSearchQuery}
										namespace="settings"
									/>

									{filteredDevices.length === 0 ? (
										<p className="py-8 text-center text-sm text-muted-foreground">
											{t('common:settings.devices.searchNoResults')}
										</p>
									) : (
										<ul className="divide-y">
											{filteredDevices.map((device) => {
												const Icon = deviceTypeIcon(device.device_type)
												const isActive = isPairedDeviceActive(device)
												const isForgetting = forgettingIds.has(
													device.endpoint_id
												)
												return (
													<li
														key={device.endpoint_id}
														className="flex items-center justify-between gap-3 py-3 first:pt-4"
													>
														<div className="flex min-w-0 items-center gap-3">
															<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
																<Icon className="h-4 w-4" />
															</div>
															<div className="min-w-0">
																<div className="flex min-w-0 items-center gap-1">
																	<p className="text-sm font-medium truncate">
																		{device.display_name}
																	</p>
																	{isActive ? (
																		<Button
																			type="button"
																			variant="ghost"
																			size="icon-xs"
																			className="shrink-0 text-muted-foreground"
																			aria-label={t(
																				'common:settings.devices.rename'
																			)}
																			onClick={() =>
																				setRenamePeerId(device.endpoint_id)
																			}
																		>
																			<Pencil className="size-3" />
																		</Button>
																	) : null}
																</div>
																<p className="text-xs text-muted-foreground truncate">
																	{deviceSubtitle(device)}
																</p>
																{!isActive ? (
																	<p className="mt-1 text-xs text-muted-foreground">
																		{t('common:settings.devices.unpairedHint')}
																	</p>
																) : null}
															</div>
														</div>
														<div className="flex shrink-0 items-center gap-2">
															<DevicePairingStatus
																device={device}
																namespace="settings"
															/>
															<Button
																type="button"
																variant="ghost"
																size="icon-sm"
																disabled={isForgetting}
																aria-busy={isForgetting}
																aria-label={
																	isForgetting
																		? t(
																				'common:settings.devices.removingDevice'
																			)
																		: t('common:settings.devices.removeDevice')
																}
																onClick={async () => {
																	if (isForgetting) return
																	setForgettingIds((prev) =>
																		new Set(prev).add(device.endpoint_id)
																	)
																	try {
																		await forget(device.endpoint_id)
																		toastManager.add({
																			title: t(
																				'common:settings.devices.deviceRemoved'
																			),
																			type: 'success',
																		})
																	} catch (error) {
																		console.error(error)
																		toastManager.add({
																			title: t(
																				'common:settings.devices.removeFailed'
																			),
																			type: 'error',
																		})
																	} finally {
																		// The row unmounts on success, but this
																		// state lives on the list, so the update
																		// always lands somewhere mounted.
																		setForgettingIds((prev) => {
																			const next = new Set(prev)
																			next.delete(device.endpoint_id)
																			return next
																		})
																	}
																}}
															>
																{isForgetting ? (
																	<Loader2 className="w-4 h-4 animate-spin" />
																) : (
																	<Trash2 className="w-4 h-4" />
																)}
															</Button>
														</div>
													</li>
												)
											})}
										</ul>
									)}
								</div>
							)}
						</FramePanel>
					</Frame>

					<NearbyDevices />

					<PairJoinModal
						open={joinOpen}
						isLoading={isJoining}
						onClose={() => setJoinOpen(false)}
						onJoin={join}
					/>
					{thisDevice ? (
						<RenameDeviceModal
							open={renameThisOpen}
							title={t('common:settings.devices.renameThisDevice')}
							description={t('common:settings.devices.renameThisDeviceHint')}
							initialName={thisDevice.display_name}
							onClose={() => setRenameThisOpen(false)}
							onSave={async (name) => {
								await renameThisDevice(name)
							}}
						/>
					) : null}
					{renamePeer ? (
						<RenameDeviceModal
							open
							title={t('common:settings.devices.renameDevice')}
							description={t('common:settings.devices.renameDeviceHint')}
							initialName={renamePeer.display_name}
							onClose={() => setRenamePeerId(null)}
							onSave={async (name) => {
								await renameDevice(renamePeer.endpoint_id, name)
							}}
						/>
					) : null}
				</>
			)}
		</div>
	)
}
