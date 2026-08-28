/**
 * Whether a receive session is genuinely occupying the receiver.
 *
 * `isReceiving` cannot answer this on its own: it also drives the view switch
 * in `Receiver.tsx`, so it stays true after a transfer finishes to keep the
 * success screen up until the user clicks Done. Reading it as "busy" makes a
 * finished transfer block the next one — the sender's second share is refused
 * with "Download already in progress" until someone dismisses a screen.
 *
 * `isExportPending` is the Android tail: `receive-completed` fires before the
 * staging directory is copied out to SAF/MediaStore, so the session really is
 * still working during that window.
 */
export type ReceiveSessionState = {
	isReceiving: boolean
	isTransporting: boolean
	isCompleted: boolean
	isExportPending: boolean
}

export function isReceiveSessionBusy({
	isReceiving,
	isTransporting,
	isCompleted,
	isExportPending,
}: ReceiveSessionState): boolean {
	if (isTransporting || isExportPending) return true
	return isReceiving && !isCompleted
}
