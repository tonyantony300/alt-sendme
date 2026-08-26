import { useCallback, useEffect, useRef, useState } from 'react'
import { listen } from '@/lib/platform-api'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import {
	forgetPairedDevice,
	joinPairing,
	renamePairedDevice,
	setDeviceDisplayName,
	startPairingHost,
	stopPairingHost,
	trustPairedDevice,
	type DeviceUnpairedPayload,
} from '@/lib/pairing-api'
import { useTranslation } from '../i18n/react-i18next-compat'
import { toastManager } from '../components/ui/toast'
import { useNodeCapability } from './useNodeCapability'
import {
	applyPresencePatch,
	usePairedDeviceEvents,
} from './usePairedDeviceEvents'
import { usePairingDataStore } from '@/store/pairing-data-store'

const PAIRING_HOST_TTL_SECS = 180

export function usePairing() {
	const { t } = useTranslation()
	const devices = usePairingDataStore((s) => s.devices)
	const thisDevice = usePairingDataStore((s) => s.thisDevice)
	const pairingCode = usePairingDataStore((s) => s.pairingCode)
	const hasHydrated = usePairingDataStore((s) => s.hasHydrated)
	const setDevices = usePairingDataStore((s) => s.setDevices)
	const setThisDevice = usePairingDataStore((s) => s.setThisDevice)
	const hydrate = usePairingDataStore((s) => s.hydrate)

	const [pairingTicket, setPairingTicket] = useState<string | null>(null)
	const [hostExpiresIn, setHostExpiresIn] = useState<number | null>(null)
	const [isJoining, setIsJoining] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	// Incremented each time a peer joins while this device is hosting a
	// pairing window, so the UI can close the QR dialog and confirm success.
	const [hostPairedCount, setHostPairedCount] = useState(0)
	const pairingTicketRef = useRef<string | null>(null)
	const { isNodeReady, isNodeStatusPending, nodeStatus, hasResolved } =
		useNodeCapability()

	useEffect(() => {
		pairingTicketRef.current = pairingTicket
	}, [pairingTicket])

	const refreshDevices = useCallback(async () => {
		await hydrate()
	}, [hydrate])

	const refreshThisDevice = useCallback(async () => {
		await hydrate()
	}, [hydrate])

	useEffect(() => {
		if (!hasResolved) return
		void hydrate()
	}, [hasResolved, hydrate])

	useEffect(() => {
		if (!IS_PAIRING_CAPABLE) return

		let disposed = false
		let unlistenPaired: (() => void) | undefined
		let unlistenExpired: (() => void) | undefined

		const setup = async () => {
			const pairedUnlisten = await listen('device-paired', () => {
				// The backend closes the pairing host once a peer completes the
				// handshake, so the ticket is no longer valid.
				if (pairingTicketRef.current != null) {
					setPairingTicket(null)
					setHostExpiresIn(null)
					setHostPairedCount((count) => count + 1)
				}
				void hydrate()
			})
			if (disposed) {
				pairedUnlisten()
			} else {
				unlistenPaired = pairedUnlisten
			}

			const expiredUnlisten = await listen('pairing-host-expired', () => {
				setPairingTicket(null)
				setHostExpiresIn(null)
				toastManager.add({
					title: t('common:settings.devices.hostClosedToast'),
					type: 'default',
				})
			})
			if (disposed) {
				expiredUnlisten()
			} else {
				unlistenExpired = expiredUnlisten
			}
		}

		void setup()

		return () => {
			disposed = true
			unlistenPaired?.()
			unlistenExpired?.()
		}
	}, [hydrate, t])

	usePairedDeviceEvents({
		onPresence: useCallback(
			(payload) => {
				applyPresencePatch(setDevices, payload)
			},
			[setDevices]
		),
		onUnpaired: useCallback(
			(payload: DeviceUnpairedPayload) => {
				if (payload.reason === 'remote') {
					toastManager.add({
						title: t('common:settings.devices.deviceUnpairedToast', {
							name:
								payload.display_name ??
								t('common:sender.pairedDevices.unknownPeer'),
						}),
						type: 'warning',
					})
				}
			},
			[t]
		),
		onRefresh: refreshDevices,
	})

	useEffect(() => {
		if (hostExpiresIn == null || hostExpiresIn <= 0) return

		const timer = window.setInterval(() => {
			setHostExpiresIn((prev) => {
				if (prev == null || prev <= 1) {
					window.clearInterval(timer)
					return null
				}
				return prev - 1
			})
		}, 1000)

		return () => window.clearInterval(timer)
	}, [hostExpiresIn])

	const openHostPairing = useCallback(async () => {
		if (!IS_PAIRING_CAPABLE || !isNodeReady) return null
		setIsLoading(true)
		try {
			const ticket = await startPairingHost({ ttlSecs: PAIRING_HOST_TTL_SECS })
			setPairingTicket(ticket)
			setHostExpiresIn(PAIRING_HOST_TTL_SECS)
			toastManager.add({
				title: t('common:settings.devices.hostOpenedToast', {
					seconds: PAIRING_HOST_TTL_SECS,
				}),
				type: 'default',
			})
			return ticket
		} finally {
			setIsLoading(false)
		}
	}, [isNodeReady, t])

	const closeHostPairing = useCallback(async () => {
		setPairingTicket(null)
		setHostExpiresIn(null)
		await stopPairingHost()
	}, [])

	const join = useCallback(
		async (ticket: string) => {
			if (!IS_PAIRING_CAPABLE || !isNodeReady) return
			setIsJoining(true)
			try {
				await joinPairing(ticket.trim())
				await hydrate()
			} finally {
				setIsJoining(false)
			}
		},
		[isNodeReady, hydrate]
	)

	const forget = useCallback(
		async (endpointId: string) => {
			await forgetPairedDevice(endpointId)
			await hydrate()
		},
		[hydrate]
	)

	const renameThisDevice = useCallback(
		async (displayName: string) => {
			const updated = await setDeviceDisplayName(displayName)
			if (updated) setThisDevice(updated)
			return updated
		},
		[setThisDevice]
	)

	const renameDevice = useCallback(
		async (endpointId: string, displayName: string) => {
			const updated = await renamePairedDevice(endpointId, displayName)
			await hydrate()
			return updated
		},
		[hydrate]
	)

	const trustDevice = useCallback(
		async (endpoindId: string, trust: boolean) => {
			const updated = await trustPairedDevice(endpoindId, trust)
			await hydrate()
			return updated
		},
		[hydrate]
	)

	const isPairingDataPending =
		IS_PAIRING_CAPABLE && (isNodeStatusPending || (isNodeReady && !hasHydrated))

	return {
		devices,
		thisDevice,
		pairingCode,
		pairingTicket,
		hostExpiresIn,
		isJoining,
		isLoading,
		hostPairedCount,
		isNodeReady,
		isNodeStatusPending,
		isPairingDataPending,
		hasHydrated,
		nodeStatus,
		refreshDevices,
		refreshThisDevice,
		openHostPairing,
		closeHostPairing,
		join,
		forget,
		renameThisDevice,
		renameDevice,
		trustDevice,
	}
}
