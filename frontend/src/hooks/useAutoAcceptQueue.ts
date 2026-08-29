import { useEffect, useRef } from 'react'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { respondPairedInvite } from '@/lib/pairing-api'
import { shouldAutoAccept, subFolderFor } from '@/lib/auto-accept'
import { useAutoAcceptQueueStore } from '@/store/auto-accept-queue-store'
import { usePairingDataStore } from '@/store/pairing-data-store'
import { useReceiverActionsStore } from '@/store/receiver-actions-store'

/**
 * Drains the auto-accept queue whenever the receiver is idle. Mounted once,
 * from `DeviceNodeSync`.
 *
 * Queueing rather than accepting inline is what makes unattended receiving
 * work: `acceptPairedInvite` refuses while a transfer is running, so a second
 * share would otherwise be answered "accepted" and then silently dropped.
 *
 * Trust is re-checked per invite, not only at enqueue time — the user may
 * untrust or unpair a device while its invite waits, and the later state is the
 * one that counts.
 */
export function useAutoAcceptQueue(): void {
	const queued = useAutoAcceptQueueStore((s) => s.queue.length)
	const isBusy = useReceiverActionsStore((s) => s.isBusy)
	const acceptPairedInvite = useReceiverActionsStore(
		(s) => s.acceptPairedInvite
	)
	// Mutual exclusion has to be a ref, not state: effect setup runs twice under
	// StrictMode, and a state flag has not committed by the second run, so two
	// drains would start at once.
	const draining = useRef(false)

	useEffect(() => {
		if (!IS_PAIRING_CAPABLE) return
		if (queued === 0 || isBusy || !acceptPairedInvite) return
		if (draining.current) return

		draining.current = true
		void (async () => {
			try {
				// Loop rather than draining one invite per effect run. Clearing
				// `draining` schedules no render, so a run that ends without
				// moving `isBusy` — an accept that returns early — would leave
				// the rest of the queue waiting on a change that never comes.
				// Store state is read fresh each pass, never from the closure.
				for (;;) {
					const actions = useReceiverActionsStore.getState()
					if (actions.isBusy) break
					const accept = actions.acceptPairedInvite
					if (!accept) break

					const invite = useAutoAcceptQueueStore.getState().shift()
					if (!invite) break

					const { devices } = usePairingDataStore.getState()
					if (!shouldAutoAccept(devices, invite.remote_endpoint_id)) {
						// Untrusted or unpaired since it was queued. Drop it
						// without responding — what an unattended machine does.
						continue
					}

					const subFolder = subFolderFor(
						devices,
						invite.remote_endpoint_id,
						invite.sender_name
					)

					void respondPairedInvite(invite.remote_endpoint_id, true).catch(
						() => {
							// Best-effort notify; the transfer proceeds regardless.
						}
					)

					try {
						// Resolves when the transfer finishes, so the next pass
						// runs against a settled receiver.
						await accept(invite, { subFolder })
					} catch (error) {
						// Caught per invite, not around the loop: one failure
						// must not strand everything queued behind it.
						// `acceptPairedInvite` surfaces its own errors.
						console.error('Auto-accept failed:', error)
					}
				}
			} finally {
				draining.current = false
			}
		})()
	}, [queued, isBusy, acceptPairedInvite])
}
