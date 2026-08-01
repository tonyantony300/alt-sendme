import { useEffect } from 'react'
import { useTranslation } from '@/i18n'
import { shortFingerprint } from '@/lib/fingerprint'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { listen } from '@/lib/platform-api'
import { usePairingDataStore } from '@/store/pairing-data-store'
import { useNearbyVerificationStore } from '@/store/nearby-verification-store'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogClose,
} from '../ui/alert-dialog'
import { Button } from '../ui/button'
import { VerificationCode } from './VerificationCode'

/**
 * The sender's half of first-contact verification.
 *
 * The receiver's dialog shows the *sender's* code and asks the user to check
 * it against the sender's screen. Until this existed there was no such
 * screen: `shortFingerprint` was computed nowhere on the sending side, so the
 * comparison the receiver was being asked to perform was impossible and
 * people simply accepted.
 *
 * Shows this device's own code — the same string the receiver is looking at,
 * derived independently from the endpoint id with no round trip.
 */
export function NearbyVerificationDialog() {
	const { t } = useTranslation()
	const target = useNearbyVerificationStore((s) => s.target)
	const clear = useNearbyVerificationStore((s) => s.clear)
	const thisEndpointId = usePairingDataStore((s) => s.thisDevice?.endpoint_id)

	useEffect(() => {
		if (!IS_PAIRING_CAPABLE || !target) return

		let disposed = false
		const unlistens: (() => void)[] = []

		const register = async (
			event: string,
			matches: (raw: string) => boolean
		) => {
			const stop = await listen(event, (e: { payload: unknown }) => {
				if (matches(String(e.payload))) clear()
			})
			if (disposed) {
				stop()
			} else {
				unlistens.push(stop)
			}
		}

		const endpointMatches = (raw: string, key: string): boolean => {
			try {
				const payload = JSON.parse(raw) as Record<string, unknown>
				const id = payload[key]
				return (
					typeof id === 'string' &&
					id.toLowerCase() === target.endpointId.toLowerCase()
				)
			} catch {
				return false
			}
		}

		void (async () => {
			// They accepted: the code did its job, get out of the way.
			//
			// Closes on ANY pairing completing, not just this peer's, because
			// `device-paired` carries only `display_name` — there is no
			// endpoint id on it to match against. Two pairings finishing while
			// this dialog is open would close it early; that needs an endpoint
			// id added to the event, which is an engine change and out of scope
			// here. The decline path below can match, and does.
			await register('device-paired', () => true)
			// They declined: nothing left to verify.
			await register('paired-invite-response', (raw) =>
				endpointMatches(raw, 'endpoint_id')
			)
		})()

		return () => {
			disposed = true
			unlistens.forEach((stop) => {
				stop()
			})
		}
	}, [target, clear])

	if (!IS_PAIRING_CAPABLE) return null

	const code = thisEndpointId ? shortFingerprint(thisEndpointId) : null

	return (
		<AlertDialog
			open={target != null}
			onOpenChange={(open) => {
				if (!open) clear()
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t('common:pairing.verification.title')}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t('common:pairing.verification.description', {
							name: target?.name ?? '',
						})}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="px-6 pb-4">
					<VerificationCode
						code={code}
						hint={t('common:pairing.verification.hint', {
							name: target?.name ?? '',
						})}
						unavailable={t('common:pairing.verification.unavailable')}
					/>
				</div>
				<AlertDialogFooter>
					<AlertDialogClose
						render={
							<Button size="sm" variant="outline">
								{t('common:pairing.verification.close')}
							</Button>
						}
						onClick={clear}
					/>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
