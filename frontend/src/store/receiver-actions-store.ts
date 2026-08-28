import { create } from 'zustand'
import type { PairedInvitePayload } from '@/lib/pairing-api'

export type AcceptPairedInviteOptions = {
	/**
	 * Folder under the download directory to file this transfer into. Set only
	 * for auto-accepted transfers; manual accepts stay flat.
	 */
	subFolder?: string | null
}

type ReceiverActionsState = {
	acceptPairedInvite:
		| ((
				invite: PairedInvitePayload,
				options?: AcceptPairedInviteOptions
		  ) => Promise<void>)
		| null
	browseSaveFolder: (() => Promise<void>) | null
	savePath: string
	/**
	 * True while a receive is running. The auto-accept drain waits on this
	 * rather than reaching into `useReceiver`'s local state.
	 */
	isBusy: boolean
	registerAcceptPairedInvite: (
		handler:
			| ((
					invite: PairedInvitePayload,
					options?: AcceptPairedInviteOptions
			  ) => Promise<void>)
			| null
	) => void
	registerBrowseSaveFolder: (handler: (() => Promise<void>) | null) => void
	setReceiverSavePath: (path: string) => void
	setReceiverBusy: (value: boolean) => void
}

export const useReceiverActionsStore = create<ReceiverActionsState>((set) => ({
	acceptPairedInvite: null,
	browseSaveFolder: null,
	savePath: '',
	isBusy: false,
	registerAcceptPairedInvite: (handler) => set({ acceptPairedInvite: handler }),
	registerBrowseSaveFolder: (handler) => set({ browseSaveFolder: handler }),
	setReceiverSavePath: (path) => set({ savePath: path }),
	setReceiverBusy: (value) => set({ isBusy: value }),
}))
