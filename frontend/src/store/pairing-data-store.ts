import { create } from 'zustand'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import {
	getDeviceInfo,
	getPairingTicket,
	listPairedDevices,
	type DeviceInfo,
	type PairedDevice,
} from '@/lib/pairing-api'
import {
	isNodeStatusSettled,
	useNodeCapabilityStore,
} from '@/store/node-capability-store'

type PairingDataState = {
	devices: PairedDevice[]
	thisDevice: DeviceInfo | null
	/** Stable pairing code for this device (valid across restarts). */
	pairingCode: string | null
	/** True after the first hydrate attempt when the node is ready (or pairing is unavailable). */
	hasHydrated: boolean
	setDevices: (
		devices: PairedDevice[] | ((prev: PairedDevice[]) => PairedDevice[])
	) => void
	setThisDevice: (device: DeviceInfo | null) => void
	hydrate: () => Promise<void>
}

export const usePairingDataStore = create<PairingDataState>((set) => ({
	devices: [],
	thisDevice: null,
	pairingCode: null,
	hasHydrated: !IS_PAIRING_CAPABLE,
	setDevices: (devices) =>
		set((state) => ({
			devices: typeof devices === 'function' ? devices(state.devices) : devices,
		})),
	setThisDevice: (thisDevice) => set({ thisDevice }),
	hydrate: async () => {
		if (!IS_PAIRING_CAPABLE) {
			set({
				devices: [],
				thisDevice: null,
				pairingCode: null,
				hasHydrated: true,
			})
			return
		}

		const { nodeStatus, hasResolved } = useNodeCapabilityStore.getState()
		if (!hasResolved) return
		if (nodeStatus.status === 'starting' || !isNodeStatusSettled(nodeStatus)) {
			// Node still booting — keep previous data and wait for ready.
			return
		}
		if (nodeStatus.status !== 'ready') {
			set({
				devices: [],
				thisDevice: null,
				pairingCode: null,
				hasHydrated: true,
			})
			return
		}

		try {
			const [devices, thisDevice, pairingCode] = await Promise.all([
				listPairedDevices(),
				getDeviceInfo(),
				getPairingTicket().catch((error) => {
					console.error('Failed to load pairing ticket:', error)
					return null
				}),
			])
			set({
				devices,
				thisDevice,
				pairingCode,
				hasHydrated: true,
			})
		} catch (error) {
			console.error('Failed to hydrate pairing data:', error)
			// Still mark hydrated so the UI can settle rather than spinning forever.
			set({ hasHydrated: true })
		}
	},
}))

/** Kick off node status + pairing preload without needing a mounted consumer. */
export async function preloadPairingData() {
	if (!IS_PAIRING_CAPABLE) return
	await useNodeCapabilityStore.getState().refresh()
	await usePairingDataStore.getState().hydrate()
}

/** Bounds how long an invite-routing decision waits on cold start before
 * proceeding with whatever `devices` snapshot exists — matches the spirit of
 * `node-capability-store`'s own `WAIT_MAX_MS` fallback. */
const HYDRATION_WAIT_MAX_MS = 10_000

/**
 * Resolves once pairing data has hydrated (immediately if it already has).
 *
 * `devices` starts empty and `preloadPairingData` populates it without being
 * awaited by any mounted component — an invite can arrive from an
 * already-paired sender before that resolves. Callers that route an incoming
 * invite based on `devices` (`DeviceNodeSync`, `NearbyInviteDialog`) must
 * await this first so a paired sender is never misrouted to the Nearby
 * fingerprint dialog just because hydration hadn't finished yet.
 */
export function pairingDataHydrated(): Promise<void> {
	if (usePairingDataStore.getState().hasHydrated) return Promise.resolve()

	return new Promise((resolve) => {
		let settled = false
		const finish = () => {
			if (settled) return
			settled = true
			clearTimeout(timer)
			unsubscribe()
			resolve()
		}
		const unsubscribe = usePairingDataStore.subscribe((state) => {
			if (state.hasHydrated) finish()
		})
		const timer = setTimeout(finish, HYDRATION_WAIT_MAX_MS)
	})
}
