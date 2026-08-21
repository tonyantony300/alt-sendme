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
 * Plain factory holding the reducer logic, free of zustand/React so it runs
 * under `node:test`. `useNearbyStore` below wraps one instance for components.
 *
 * `platform-api` is imported lazily inside `hydrate` — its dependency graph
 * uses extensionless imports that plain `node --test` can't resolve, and the
 * tests never call `hydrate`.
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
		// `nearby-unavailable` fires during node init, before this store listens,
		// so re-query on every hydrate. Also clears a stale reason on recovery.
		const status = await invoke<{ reason: string | null }>('nearby_status')
		devices = [...list].sort(compareNearbyDevices)
		unavailableReason = status.reason
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
				set({
					devices: core.devices(),
					unavailableReason: core.unavailableReason(),
				})
			} catch (error) {
				console.error('Failed to hydrate nearby devices:', error)
			}
		},
	}
})

/**
 * Refetches the full Nearby list and upserts just `endpointId` from it — the
 * discovery events carry only an endpoint id, so the rest of the row has to
 * come from `list_nearby`.
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
 * screen rather than app-wide, since nothing else reads the Nearby list.
 */
export async function startNearbyListeners(): Promise<() => void> {
	const { listen } = await import('../lib/platform-api.js')
	const unlistenFns: Array<() => void> = []

	unlistenFns.push(
		await listen('nearby-device-found', (event: { payload: unknown }) => {
			const payload = parseNearbyPayload<NearbyEventPayload>(event.payload)
			if (payload?.endpointId) {
				// A sighting proves discovery works — drop any stale banner.
				useNearbyStore.getState().setUnavailable(null)
				void refreshOne(payload.endpointId)
			}
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
