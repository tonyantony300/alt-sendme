import { create } from 'zustand'
import { enqueueInvite } from '@/lib/auto-accept'
import type { PairedInvitePayload } from '@/lib/pairing-api'

/**
 * Invites from trusted devices waiting for the receiver to go idle.
 *
 * In-memory only. A restart loses pending invites, which matches today's
 * behaviour — invites are not persisted at all.
 */
type AutoAcceptQueueState = {
	queue: PairedInvitePayload[]
	enqueue: (invite: PairedInvitePayload) => void
	shift: () => PairedInvitePayload | null
}

export const useAutoAcceptQueueStore = create<AutoAcceptQueueState>(
	(set, get) => ({
		queue: [],
		enqueue: (invite) => {
			const { queue } = get()
			const next = enqueueInvite(queue, invite)
			// `enqueueInvite` returns the same array when it declines the invite,
			// so this also avoids a pointless re-render.
			if (next === queue) {
				console.warn(
					'Auto-accept queue rejected an invite (duplicate or full):',
					invite.remote_endpoint_id
				)
				return
			}
			set({ queue: next })
		},
		shift: () => {
			const { queue } = get()
			if (queue.length === 0) return null
			const [head, ...rest] = queue
			set({ queue: rest })
			return head
		},
	})
)
