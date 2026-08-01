import { useEffect } from 'react'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { listen } from '@/lib/platform-api'
import { isKnownPairedEndpoint } from '@/lib/pairing-api'
import {
	pairingDataHydrated,
	usePairingDataStore,
} from '@/store/pairing-data-store'
import {
	buildInviteNotification,
	type NotificationKind,
} from '@/lib/invite-notification'
import { sendSystemNotification } from '@/lib/systemNotification'
import { formatFileSize } from '@/lib/utils'
import { useTranslation } from '@/i18n'

/**
 * Raises OS notifications for pairing and invite events.
 *
 * Deliberately a separate listener from the dialogs that handle the same
 * events: the dialogs own user interaction, this owns attention. Keeping them
 * apart means notification changes can't break the accept/decline path.
 *
 * Mounted once, from `DeviceNodeSync`.
 */
export function useInviteNotifications(): void {
	const { t } = useTranslation()

	useEffect(() => {
		if (!IS_PAIRING_CAPABLE) return

		let disposed = false
		const unlistens: (() => void)[] = []

		const notify = (kind: NotificationKind, payload: unknown) => {
			const content = buildInviteNotification(kind, payload, {
				t,
				formatSize: formatFileSize,
			})
			if (!content) return
			// Best-effort: a notification failure must never touch the invite
			// flow, which is the actual feature.
			void sendSystemNotification(content)
		}

		const parse = (raw: unknown): Record<string, unknown> | null => {
			try {
				const value = JSON.parse(String(raw))
				return typeof value === 'object' && value !== null
					? (value as Record<string, unknown>)
					: null
			} catch {
				return null
			}
		}

		const register = async (
			event: string,
			handler: (payload: Record<string, unknown>) => void
		) => {
			const stop = await listen(event, (e: { payload: unknown }) => {
				const payload = parse(e.payload)
				if (payload) handler(payload)
			})
			if (disposed) {
				stop()
			} else {
				unlistens.push(stop)
			}
		}

		const setup = async () => {
			await register('nearby-pair-request-received', (payload) => {
				notify('pair-request', payload)
			})

			await register('paired-invite-received', (payload) => {
				void (async () => {
					// `devices` is empty on cold start; without this wait an
					// invite from a paired sender briefly looks unpaired and
					// would be announced as "nearby". Same guard the two
					// dialog listeners use.
					await pairingDataHydrated()
					if (disposed) return
					const { devices } = usePairingDataStore.getState()
					const paired = isKnownPairedEndpoint(
						devices,
						String(payload.remote_endpoint_id ?? '')
					)
					notify(paired ? 'invite-paired' : 'invite-nearby', payload)
				})()
			})

			await register('paired-invite-response', (payload) => {
				// Accepts lead straight into a transfer that reports its own
				// progress and completion; only declines need announcing.
				if (payload.response !== 'declined') return
				notify('invite-declined', payload)
			})

			await register('device-paired', (payload) => {
				notify('device-paired', payload)
			})
		}

		void setup()

		return () => {
			disposed = true
			unlistens.forEach((stop) => {
				stop()
			})
		}
	}, [t])
}
