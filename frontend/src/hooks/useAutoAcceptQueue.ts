import { useEffect, useRef } from 'react'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { respondPairedInvite } from '@/lib/pairing-api'
import { shouldAutoAccept, subFolderFor } from '@/lib/auto-accept'
import { useAutoAcceptQueueStore } from '@/store/auto-accept-queue-store'
import { usePairingDataStore } from '@/store/pairing-data-store'
import { useReceiverActionsStore } from '@/store/receiver-actions-store'

/**
 * Drains the auto-accept queue one invite at a time, whenever the receiver is
 * idle. Mounted once, from `DeviceNodeSync`.
 *
 * Queueing rather than accepting inline is what makes unattended receiving
 * work: `acceptPairedInvite` refuses while a transfer is running, so a second
 * share would otherwise be answered "accepted" and then silently dropped.
 *
 * Trust is re-checked here, not only at enqueue time — the user may untrust or
 * unpair a device while its invite waits, and the later state is the one that
 * counts.
 */
export function useAutoAcceptQueue(): void {
	const queued = useAutoAcceptQueueStore((s) => s.queue.length)
	const isBusy = useReceiverActionsStore((s) => s.isBusy)
	const acceptPairedInvite = useReceiverActionsStore(
		(s) => s.acceptPairedInvite
	)
	const draining = useRef(false)

	useEffect(() => {
		if (!IS_PAIRING_CAPABLE) return
		if (queued === 0 || isBusy || !acceptPairedInvite) return
		if (draining.current) return

		draining.current = true
		void (async () => {
			try {
				const invite = useAutoAcceptQueueStore.getState().shift()
				if (!invite) return

				const { devices } = usePairingDataStore.getState()
				if (!shouldAutoAccept(devices, invite.remote_endpoint_id)) {
					// Untrusted or unpaired since it was queued. Drop it without
					// responding — the same thing an unattended machine would do.
					return
				}

				const subFolder = subFolderFor(
					devices,
					invite.remote_endpoint_id,
					invite.sender_name
				)

				void respondPairedInvite(invite.remote_endpoint_id, true).catch(() => {
					// Best-effort notify; the transfer proceeds regardless.
				})

				await acceptPairedInvite(invite, { subFolder })
			} catch (error) {
				// `acceptPairedInvite` surfaces its own errors; one stalled invite
				// must never wedge the queue.
				console.error('Auto-accept failed:', error)
			} finally {
				draining.current = false
			}
		})()
	}, [queued, isBusy, acceptPairedInvite])
}
