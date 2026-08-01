import { useEffect, useState } from 'react'
import { useTranslation } from '@/i18n'
import { deviceTypeIcon } from '@/lib/device-icon'
import { type Discoverability, getDiscoverability } from '@/lib/pairing-api'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { listen } from '@/lib/platform-api'
import {
	type NearbyDevice,
	startNearbyListeners,
	useNearbyStore,
} from '@/store/nearby-store'
import { Badge } from '../ui/badge'
import { Frame, FrameDescription, FramePanel, FrameTitle } from '../ui/frame'

/** Fallback label for a device that hasn't answered the identity probe yet. */
function truncatedEndpointId(endpointId: string): string {
	return `${endpointId.slice(0, 8)}…`
}

/**
 * Read-only Nearby list for Settings → Devices. Sending happens from the
 * share sheet ("Send to a device"), not from here.
 */
export function NearbyDevices() {
	const { t } = useTranslation()
	const devices = useNearbyStore((s) => s.devices)
	const unavailableReason = useNearbyStore((s) => s.unavailableReason)
	const hydrate = useNearbyStore((s) => s.hydrate)
	const [discoverability, setDiscoverability] =
		useState<Discoverability | null>(null)

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
						{devices.map((device) => (
							<NearbyDeviceRow key={device.endpointId} device={device} />
						))}
					</ul>
				)}
			</FramePanel>
		</Frame>
	)
}

function NearbyDeviceRow({ device }: { device: NearbyDevice }) {
	const { t } = useTranslation()
	const Icon = deviceTypeIcon(device.deviceType)
	const label =
		device.identified && device.displayName
			? device.displayName
			: truncatedEndpointId(device.endpointId)

	return (
		<li className="flex items-center gap-3 py-3 first:pt-0">
			<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
				<Icon className="h-4 w-4" />
			</div>
			<div className="flex min-w-0 items-center gap-1.5">
				<p className="truncate text-sm font-medium">{label}</p>
				<Badge variant="warning" size="sm" className="shrink-0">
					{t('common:settings.devices.nearby.unverified')}
				</Badge>
			</div>
		</li>
	)
}
