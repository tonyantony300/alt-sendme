import { useEffect, useRef } from 'react'
import { listen } from '@/lib/platform-api'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { getRelayConfigArg } from '@/lib/relay'
import { getDiscoveryConfigArg } from '@/lib/discovery'
import {
	isKnownPairedEndpoint,
	reconfigureNodeRelay,
	setDiscoverability,
} from '@/lib/pairing-api'
import { useAppSettingStore } from '@/store/app-setting'
import type {
	PairedInvitePayload,
	PairedInviteResponsePayload,
} from '@/lib/pairing-api'
import { usePairedInviteStore } from '@/store/paired-invite-store'
import {
	usePairingDataStore,
	preloadPairingData,
	pairingDataHydrated,
} from '@/store/pairing-data-store'
import { ensureNodeCapabilityLifecycle } from '@/store/node-capability-store'
import { useNodeCapability } from '@/hooks/useNodeCapability'
import { useTranslation } from '@/i18n'
import { toastManager } from '../ui/toast'

/** Syncs relay settings to the device node and listens for paired invites globally. */
export function DeviceNodeSync() {
	const { t } = useTranslation()
	const { isNodeReady, refreshNodeStatus } = useNodeCapability()
	const setInvite = usePairedInviteStore((s) => s.setInvite)
	const didSyncRelay = useRef(false)

	// Warm node status + devices/this-device before settings opens, so the
	// first Devices visit paints complete content instead of loading → ready.
	useEffect(() => {
		if (!IS_PAIRING_CAPABLE) return
		ensureNodeCapabilityLifecycle()
		void preloadPairingData()
	}, [])

	// Preload may finish while the node is still starting; hydrate once ready.
	useEffect(() => {
		if (!IS_PAIRING_CAPABLE || !isNodeReady) return
		void usePairingDataStore.getState().hydrate()
	}, [isNodeReady])

	useEffect(() => {
		if (!IS_PAIRING_CAPABLE || !isNodeReady || didSyncRelay.current) return
		didSyncRelay.current = true
		void reconfigureNodeRelay(
			getRelayConfigArg(),
			getDiscoveryConfigArg()
		).catch((error) => {
			// Allow a later retry if the first sync failed (e.g. node still settling).
			didSyncRelay.current = false
			console.warn('Failed to sync node relay on startup:', error)
		})
		// The node already applied the persisted discoverability at startup
		// (`init_node_service` reads this store's file before discovery
		// starts); re-applying here is a safety net for the case where that
		// read failed, mirroring how the relay settings sync above.
		void setDiscoverability(
			useAppSettingStore.getState().discoverability
		).catch((error) => {
			console.warn('Failed to sync discoverability on startup:', error)
		})
	}, [isNodeReady])

	useEffect(() => {
		if (!IS_PAIRING_CAPABLE) return

		let disposed = false
		let unlistenInvite: (() => void) | undefined
		let unlistenResponse: (() => void) | undefined
		let unlistenExpired: (() => void) | undefined

		const setup = async () => {
			const inviteUnlisten = await listen(
				'paired-invite-received',
				(event: { payload: unknown }) => {
					let payload: PairedInvitePayload
					try {
						payload = JSON.parse(String(event.payload)) as PairedInvitePayload
					} catch {
						// Ignore malformed invite payloads
						return
					}
					void (async () => {
						// Same event carries both paired and Nearby invites (see
						// `emit_paired_invite_received`) — an unpaired sender's
						// invite belongs to `NearbyInviteDialog`, which shows the
						// fingerprint confirmation this dialog doesn't have. `devices`
						// starts empty on cold start, so wait for it to hydrate before
						// deciding — otherwise a genuinely paired sender's invite would
						// briefly look unpaired and get misrouted there.
						await pairingDataHydrated()
						if (disposed) return
						const { devices } = usePairingDataStore.getState()
						if (!isKnownPairedEndpoint(devices, payload.remote_endpoint_id)) {
							return
						}
						setInvite(payload)
					})()
				}
			)
			if (disposed) {
				inviteUnlisten()
			} else {
				unlistenInvite = inviteUnlisten
			}

			const responseUnlisten = await listen(
				'paired-invite-response',
				(event: { payload: unknown }) => {
					try {
						const payload = JSON.parse(
							String(event.payload)
						) as PairedInviteResponsePayload
						if (payload.response !== 'declined') return
						const name =
							payload.display_name?.trim() ||
							t('common:sender.pairedDevices.unknownPeer')
						toastManager.add({
							title: t('common:sender.pairedDevices.inviteDeclined', {
								name,
							}),
							description: t('common:sender.pairedDevices.inviteDeclinedDesc'),
							type: 'warning',
						})
					} catch {
						// Ignore malformed response payloads
					}
				}
			)
			if (disposed) {
				responseUnlisten()
			} else {
				unlistenResponse = responseUnlisten
			}

			const expiredUnlisten = await listen('pairing-host-expired', () => {
				void refreshNodeStatus()
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
			unlistenInvite?.()
			unlistenResponse?.()
			unlistenExpired?.()
		}
	}, [setInvite, refreshNodeStatus, t])

	return null
}
