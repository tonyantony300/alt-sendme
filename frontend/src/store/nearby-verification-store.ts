import { create } from 'zustand'

export type VerificationTarget = {
	endpointId: string
	/** Best available label for the peer, for the "read this to X" copy. */
	name: string
}

type NearbyVerificationState = {
	target: VerificationTarget | null
	/** Open the sender-side code dialog for a peer we just reached. */
	show: (target: VerificationTarget) => void
	/** Close it — resolved, declined, or dismissed by hand. */
	clear: () => void
}

/**
 * Drives the sender's verification-code dialog. A store rather than local state
 * because the two paths that open it live in different trees from the dialog,
 * which is mounted once globally so it survives either surface closing.
 */
export const useNearbyVerificationStore = create<NearbyVerificationState>(
	(set) => ({
		target: null,
		show: (target) => set({ target }),
		clear: () => set({ target: null }),
	})
)
