import { useEffect, useRef } from 'react'
import { listen } from '@/lib/platform-api'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { getRelayConfigArg } from '@/lib/relay'
import { getDiscoveryConfigArg } from '@/lib/discovery'
import { isKnownPairedEndpoint, reconfigureNodeRelay } from '@/lib/pairing-api'
import type {
	PairedInvitePayload,
	PairedInviteResponsePayload,
} from '@/lib/pairing-api'
import { usePairedInviteStore } from '@/store/paired-invite-store'
import {
	usePairingDataStore,
	preloadPairingData,
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
					try {
						const payload = JSON.parse(
							String(event.payload)
						) as PairedInvitePayload
						// Same event carries both paired and Nearby invites (see
						// `emit_paired_invite_received`) — an unpaired sender's
						// invite belongs to `NearbyInviteDialog`, which shows the
						// fingerprint confirmation this dialog doesn't have.
						const { devices } = usePairingDataStore.getState()
						if (!isKnownPairedEndpoint(devices, payload.remote_endpoint_id)) {
							return
						}
						setInvite(payload)
					} catch {
						// Ignore malformed invite payloads
					}
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
