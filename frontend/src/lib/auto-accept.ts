/**
 * Routing and queueing for invites from trusted paired devices.
 *
 * Kept pure and free of runtime imports from `pairing-api` / `platform-api` —
 * those pull in Tauri and WASM at module load, which `pnpm test:lib` cannot
 * execute. Types only.
 */
import type { PairedDevice, PairedInvitePayload } from './pairing-api'

/** A trusted device that keeps sending must not grow the queue without bound. */
export const AUTO_ACCEPT_QUEUE_LIMIT = 20

type TrustCandidate = Pick<
	PairedDevice,
	'endpoint_id' | 'display_name' | 'pairing_status' | 'trusted'
>

function findDevice<T extends { endpoint_id: string }>(
	devices: T[],
	endpointId: string
): T | undefined {
	const id = endpointId.trim().toLowerCase()
	if (!id) return undefined
	return devices.find((device) => device.endpoint_id.toLowerCase() === id)
}

/**
 * True when an invite from `endpointId` should skip the accept dialog.
 *
 * The status check is not redundant with the trust check: a device whose local
 * identity went stale keeps its stored `trusted` flag and stays on the node's
 * allowlist, so it can still deliver an invite while the Devices list shows it
 * as no longer actively paired. An unknown endpoint is a Nearby sender and is
 * never auto-accepted.
 */
export function shouldAutoAccept(
	devices: TrustCandidate[],
	endpointId: string
): boolean {
	const device = findDevice(devices, endpointId)
	if (!device) return false
	if ((device.pairing_status ?? 'active') !== 'active') return false
	return device.trusted === true
}

/**
 * Append an invite to the pending queue. Returns the queue unchanged when the
 * ticket is already queued or the cap is reached — identity is preserved so
 * callers can detect the no-op and skip a state update.
 */
export function enqueueInvite(
	queue: PairedInvitePayload[],
	invite: PairedInvitePayload
): PairedInvitePayload[] {
	if (queue.some((queued) => queued.blob_ticket === invite.blob_ticket)) {
		return queue
	}
	if (queue.length >= AUTO_ACCEPT_QUEUE_LIMIT) {
		return queue
	}
	return [...queue, invite]
}

/**
 * The folder name to file this sender's files under. The locally stored name
 * wins: it is what the user renamed the device to and what the Devices list
 * shows. Rust sanitizes the result before it becomes a path component.
 */
export function subFolderFor(
	devices: TrustCandidate[],
	endpointId: string,
	fallbackName: string
): string {
	const stored = findDevice(devices, endpointId)?.display_name?.trim()
	return stored || fallbackName.trim()
}
