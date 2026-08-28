import { useEffect } from 'react'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { listen } from '@/lib/platform-api'
import { isKnownPairedEndpoint } from '@/lib/pairing-api'
import { shouldAutoAccept } from '@/lib/auto-accept'
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
 * Raises OS notifications for pairing and invite events. A separate listener
 * from the dialogs on the same events — they own interaction, this owns
 * attention — so notification changes can't break accept/decline.
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
			// Best-effort: a notification failure must not touch the invite flow.
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
					// Without this wait a paired sender's invite briefly looks
					// unpaired and gets announced as "nearby". Same guard the
					// dialog listeners use.
					await pairingDataHydrated()
					if (disposed) return
					const { devices } = usePairingDataStore.getState()
					const endpointId = String(payload.remote_endpoint_id ?? '')
					if (!isKnownPairedEndpoint(devices, endpointId)) {
						notify('invite-nearby', payload)
						return
					}
					// A trusted device's transfer starts with nobody watching, so
					// the banner says it is already happening rather than asking.
					notify(
						shouldAutoAccept(devices, endpointId)
							? 'invite-auto-accepted'
							: 'invite-paired',
						payload
					)
				})()
			})

			await register('paired-invite-response', (payload) => {
				// An accept leads into a transfer that reports itself.
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
