import { create } from 'zustand'
import { IS_PAIRING_CAPABLE } from '../lib/platform.js'

export interface NearbyDevice {
	endpointId: string
	fingerprint: string
	displayName: string | null
	deviceType: string | null
	os: string | null
	identified: boolean
}

/** Sorts identified devices first, then by display name, then by endpoint id. */
function compareNearbyDevices(a: NearbyDevice, b: NearbyDevice): number {
	if (a.identified !== b.identified) return a.identified ? -1 : 1
	if (a.identified) {
		const byName = (a.displayName ?? '').localeCompare(b.displayName ?? '')
		if (byName !== 0) return byName
	}
	return a.endpointId.localeCompare(b.endpointId)
}

export interface NearbyStoreApi {
	devices: () => NearbyDevice[]
	unavailableReason: () => string | null
	upsert: (device: NearbyDevice) => void
	remove: (endpointId: string) => void
	setUnavailable: (reason: string | null) => void
	hydrate: () => Promise<void>
}

/**
 * Plain factory holding the reducer logic, independent of zustand/React so it
 * can run under `node:test` (see `nearby-store.test.ts`). `useNearbyStore`
 * below wraps one instance of this for component consumption.
 *
 * `platform-api` is imported lazily (inside `hydrate`, not at module scope):
 * that file's own dependency graph uses extensionless relative imports meant
 * for Vite, which plain `node --test` cannot resolve. Since the test suite
 * never calls `hydrate`, the dynamic import is never reached.
 */
export function createNearbyStore(): NearbyStoreApi {
	let devices: NearbyDevice[] = []
	let unavailableReason: string | null = null

	const upsert: NearbyStoreApi['upsert'] = (device) => {
		const next = devices.filter((d) => d.endpointId !== device.endpointId)
		next.push(device)
		next.sort(compareNearbyDevices)
		devices = next
	}

	const remove: NearbyStoreApi['remove'] = (endpointId) => {
		devices = devices.filter((d) => d.endpointId !== endpointId)
	}

	const setUnavailable: NearbyStoreApi['setUnavailable'] = (reason) => {
		unavailableReason = reason
	}

	const hydrate: NearbyStoreApi['hydrate'] = async () => {
		if (!IS_PAIRING_CAPABLE) return
		const { invoke } = await import('../lib/platform-api.js')
		const list = await invoke<NearbyDevice[]>('list_nearby')
		devices = [...list].sort(compareNearbyDevices)
	}

	return {
		devices: () => devices,
		unavailableReason: () => unavailableReason,
		upsert,
		remove,
		setUnavailable,
		hydrate,
	}
}

type NearbyState = {
	devices: NearbyDevice[]
	unavailableReason: string | null
	upsert: (device: NearbyDevice) => void
	remove: (endpointId: string) => void
	setUnavailable: (reason: string | null) => void
	hydrate: () => Promise<void>
}

export const useNearbyStore = create<NearbyState>((set) => {
	const core = createNearbyStore()
	return {
		devices: core.devices(),
		unavailableReason: core.unavailableReason(),
		upsert: (device) => {
			core.upsert(device)
			set({ devices: core.devices() })
		},
		remove: (endpointId) => {
			core.remove(endpointId)
			set({ devices: core.devices() })
		},
		setUnavailable: (reason) => {
			core.setUnavailable(reason)
			set({ unavailableReason: core.unavailableReason() })
		},
		hydrate: async () => {
			try {
				await core.hydrate()
				set({ devices: core.devices() })
			} catch (error) {
				console.error('Failed to hydrate nearby devices:', error)
			}
		},
	}
})

/**
 * Refetches the full Nearby list and upserts just `endpointId` from it.
 * `nearby-device-found`/`nearby-device-identified` events only carry the
 * endpoint id (see `engine/native/src/node.rs::emit_nearby`) — the rest of
 * the row (fingerprint, name, type, os) has to come from `list_nearby`.
 */
async function refreshOne(endpointId: string): Promise<void> {
	if (!IS_PAIRING_CAPABLE) return
	try {
		const { invoke } = await import('../lib/platform-api.js')
		const list = await invoke<NearbyDevice[]>('list_nearby')
		const found = list.find((d) => d.endpointId === endpointId)
		if (found) useNearbyStore.getState().upsert(found)
	} catch (error) {
		console.error('Failed to refresh nearby device:', error)
	}
}

type NearbyEventPayload = { endpointId: string }
type NearbyReasonPayload = { reason: string }

function parseNearbyPayload<T>(payload: unknown): T | null {
	try {
		return JSON.parse(String(payload)) as T
	} catch {
		return null
	}
}

/**
 * Registers the Nearby discovery listeners. Scoped to the Devices settings
 * screen (via `NearbyDevices`'s mount/unmount) rather than app-wide, since
 * nothing else currently reads the Nearby list.
 */
export async function startNearbyListeners(): Promise<() => void> {
	const { listen } = await import('../lib/platform-api.js')
	const unlistenFns: Array<() => void> = []

	unlistenFns.push(
		await listen('nearby-device-found', (event: { payload: unknown }) => {
			const payload = parseNearbyPayload<NearbyEventPayload>(event.payload)
			if (payload?.endpointId) void refreshOne(payload.endpointId)
		})
	)
	unlistenFns.push(
		await listen('nearby-device-identified', (event: { payload: unknown }) => {
			const payload = parseNearbyPayload<NearbyEventPayload>(event.payload)
			if (payload?.endpointId) void refreshOne(payload.endpointId)
		})
	)
	unlistenFns.push(
		await listen('nearby-device-lost', (event: { payload: unknown }) => {
			const payload = parseNearbyPayload<NearbyEventPayload>(event.payload)
			if (payload?.endpointId)
				useNearbyStore.getState().remove(payload.endpointId)
		})
	)
	unlistenFns.push(
		await listen('nearby-unavailable', (event: { payload: unknown }) => {
			const payload = parseNearbyPayload<NearbyReasonPayload>(event.payload)
			useNearbyStore.getState().setUnavailable(payload?.reason ?? null)
		})
	)

	return () => {
		for (const unlisten of unlistenFns) unlisten()
	}
}
