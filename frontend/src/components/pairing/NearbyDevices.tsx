import { useEffect, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { listen, openDialog } from '@/lib/platform-api'
import {
	getDiscoverability,
	sendToNearby,
	type Discoverability,
} from '@/lib/pairing-api'
import { deviceTypeIcon } from '@/lib/device-icon'
import {
	startNearbyListeners,
	useNearbyStore,
	type NearbyDevice,
} from '@/store/nearby-store'
import { Frame, FrameDescription, FramePanel, FrameTitle } from '../ui/frame'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { toastManager } from '../ui/toast'

type SendState = 'sending' | 'sent' | 'failed'

/** Fallback label for a device that hasn't answered the identity probe yet. */
function truncatedEndpointId(endpointId: string): string {
	return `${endpointId.slice(0, 8)}…`
}

export function NearbyDevices() {
	const { t } = useTranslation()
	const devices = useNearbyStore((s) => s.devices)
	const unavailableReason = useNearbyStore((s) => s.unavailableReason)
	const hydrate = useNearbyStore((s) => s.hydrate)
	const [discoverability, setDiscoverability] =
		useState<Discoverability | null>(null)
	const [sendState, setSendState] = useState<Record<string, SendState>>({})

	useEffect(() => {
		if (!IS_PAIRING_CAPABLE) return

		let disposed = false
		let unlistenNearby: (() => void) | undefined
		let unlistenPaired: (() => void) | undefined

		void hydrate()
		void getDiscoverability().then((value) => {
			if (!disposed) setDiscoverability(value)
		})
		void startNearbyListeners().then((stop) => {
			if (disposed) {
				stop()
			} else {
				unlistenNearby = stop
			}
		})
		// Accepting a Nearby invite promotes the sender to paired and drops it
		// from the registry server-side, but that doesn't emit a Nearby event —
		// re-hydrate on `device-paired` so it doesn't linger here as "unverified".
		void listen('device-paired', () => void hydrate()).then((stop) => {
			if (disposed) {
				stop()
			} else {
				unlistenPaired = stop
			}
		})

		return () => {
			disposed = true
			unlistenNearby?.()
			unlistenPaired?.()
		}
	}, [hydrate])

	if (!IS_PAIRING_CAPABLE) return null

	const handleSend = async (device: NearbyDevice) => {
		const selection = await openDialog({ multiple: true })
		const paths = Array.isArray(selection)
			? selection
			: selection
				? [selection]
				: []
		if (!paths.length) return

		setSendState((prev) => ({ ...prev, [device.endpointId]: 'sending' }))
		try {
			await sendToNearby(device.endpointId, paths)
			setSendState((prev) => ({ ...prev, [device.endpointId]: 'sent' }))
			toastManager.add({
				title: t('common:settings.devices.nearby.inviteSent'),
				type: 'success',
			})
		} catch (error) {
			console.error('Failed to send to nearby device:', error)
			setSendState((prev) => ({ ...prev, [device.endpointId]: 'failed' }))
			toastManager.add({
				title: t('common:settings.devices.nearby.inviteFailed'),
				type: 'error',
			})
		} finally {
			window.setTimeout(() => {
				setSendState((prev) => {
					if (!(device.endpointId in prev)) return prev
					const next = { ...prev }
					delete next[device.endpointId]
					return next
				})
			}, 2000)
		}
	}

	const discoverabilityHint =
		discoverability === 'paired-only'
			? t('common:settings.devices.nearby.discoverabilityPairedOnlyHint')
			: discoverability === 'off'
				? t('common:settings.devices.nearby.discoverabilityOffHint')
				: null

	return (
		<Frame>
			<FramePanel className="flex flex-col gap-4">
				<div className="space-y-1">
					<FrameTitle>{t('common:settings.devices.nearby.heading')}</FrameTitle>
					<FrameDescription>
						{t('common:settings.devices.nearby.hint')}
					</FrameDescription>
					{discoverabilityHint ? (
						<p className="text-xs text-muted-foreground">
							{discoverabilityHint}
						</p>
					) : null}
				</div>

				{unavailableReason ? (
					<div className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
						<p className="font-medium text-foreground">
							{t('common:settings.devices.nearby.unavailableTitle')}
						</p>
						<p className="mt-1">{unavailableReason}</p>
					</div>
				) : devices.length === 0 ? (
					<p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
						{t('common:settings.devices.nearby.empty')}
					</p>
				) : (
					<ul className="divide-y">
						{devices.map((device) => {
							const Icon = deviceTypeIcon(device.deviceType)
							const isSending = sendState[device.endpointId] === 'sending'
							const label =
								device.identified && device.displayName
									? device.displayName
									: truncatedEndpointId(device.endpointId)

							return (
								<li
									key={device.endpointId}
									className="flex items-center justify-between gap-3 py-3 first:pt-0"
								>
									<div className="flex min-w-0 items-center gap-3">
										<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
											<Icon className="h-4 w-4" />
										</div>
										<div className="min-w-0 flex items-center gap-1.5">
											<p className="truncate text-sm font-medium">{label}</p>
											<Badge variant="warning" size="sm" className="shrink-0">
												{t('common:settings.devices.nearby.unverified')}
											</Badge>
										</div>
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										className="shrink-0"
										disabled={isSending}
										onClick={() => void handleSend(device)}
									>
										{isSending ? (
											<Loader2 className="h-3.5 w-3.5 animate-spin" />
										) : (
											<Send className="h-3.5 w-3.5" />
										)}
										{t('common:settings.devices.nearby.send')}
									</Button>
								</li>
							)
						})}
					</ul>
				)}
			</FramePanel>
		</Frame>
	)
}
