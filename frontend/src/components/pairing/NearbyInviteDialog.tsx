import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '@/i18n'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { listen } from '@/lib/platform-api'
import { formatFileSize } from '@/lib/utils'
import { shortFingerprint } from '@/lib/fingerprint'
import {
	isKnownPairedEndpoint,
	respondNearbyInvite,
	type PairedInvitePayload,
} from '@/lib/pairing-api'
import {
	pairingDataHydrated,
	usePairingDataStore,
} from '@/store/pairing-data-store'
import { useReceiverActionsStore } from '@/store/receiver-actions-store'
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
import { toastManager } from '../ui/toast'

/**
 * The receiver's prompt for an invite from a device that isn't paired yet.
 * `paired-invite-received` carries the same payload for both paired and
 * Nearby senders (see `emit_paired_invite_received` in
 * `engine/native/src/pairing_util.rs`) — this component only reacts to it
 * when the sender is NOT already a known paired device, leaving the routine
 * case to `PairedInviteDialog`.
 */
export function NearbyInviteDialog() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const location = useLocation()
	const [invite, setInvite] = useState<PairedInvitePayload | null>(null)
	const acceptPairedInvite = useReceiverActionsStore(
		(s) => s.acceptPairedInvite
	)

	useEffect(() => {
		if (!IS_PAIRING_CAPABLE) return

		let disposed = false
		let unlisten: (() => void) | undefined

		const setup = async () => {
			const stop = await listen(
				'paired-invite-received',
				(event: { payload: unknown }) => {
					let payload: PairedInvitePayload
					try {
						payload = JSON.parse(String(event.payload)) as PairedInvitePayload
					} catch {
						// Ignore malformed invite payloads
						return
					}
					void (async () => {
						// `devices` starts empty on cold start — wait for it to
						// hydrate before deciding, otherwise an invite from an
						// already-paired sender can arrive first and get shown
						// here as "unverified" instead of in `PairedInviteDialog`.
						await pairingDataHydrated()
						if (disposed) return
						const { devices } = usePairingDataStore.getState()
						if (isKnownPairedEndpoint(devices, payload.remote_endpoint_id)) {
							return
						}
						setInvite(payload)
					})()
				}
			)
			if (disposed) {
				stop()
			} else {
				unlisten = stop
			}
		}

		void setup()

		return () => {
			disposed = true
			unlisten?.()
		}
	}, [])

	if (!IS_PAIRING_CAPABLE) return null

	const notifyInviteResponse = (endpointId: string, accepted: boolean) => {
		void respondNearbyInvite(endpointId, accepted).catch(() => {
			// Best-effort notify; accept/decline UI already proceeded.
		})
	}

	const decline = () => {
		// AlertDialogClose's own `onClick` and the dialog's `onOpenChange` both
		// fire from a single close click — read-and-clear atomically via the
		// state updater (no store to re-read from `getState()` here, unlike
		// `PairedInviteDialog`) so the second call is a no-op instead of
		// double-sending the decline.
		setInvite((current) => {
			if (!current) return current
			notifyInviteResponse(current.remote_endpoint_id, false)
			return null
		})
	}

	const accept = async () => {
		const current = invite
		if (!current) return
		// The verification code is the whole point of this dialog — never
		// accept on its behalf if it couldn't be computed (malformed endpoint
		// id). The button below is disabled for the same reason; this is the
		// belt-and-suspenders check in case it's ever reached anyway.
		if (!shortFingerprint(current.remote_endpoint_id)) return
		if (!acceptPairedInvite) {
			toastManager.add({
				title: t('common:errors.receiveFailed'),
				description: t('common:receiver.openReceiveTabHint'),
				type: 'warning',
			})
			return
		}

		setInvite(null)
		notifyInviteResponse(current.remote_endpoint_id, true)
		if (location.pathname !== '/') {
			navigate('/')
		}
		try {
			await acceptPairedInvite(current)
		} catch {
			// receiveWithTicket / accept path surfaces its own errors
		}
	}

	const fingerprint = invite
		? shortFingerprint(invite.remote_endpoint_id)
		: null
	const canAccept = invite != null && fingerprint != null

	return (
		<AlertDialog
			open={invite != null}
			onOpenChange={(open) => {
				if (!open) decline()
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t('common:receiver.receiveFromNearbyTitle')}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{invite
							? invite.total_size > 0
								? t('common:receiver.receiveFromNearbyDescription', {
										sender: invite.sender_name,
										count: invite.file_count,
										size: formatFileSize(invite.total_size),
									})
								: t('common:receiver.receiveFromNearbyDescriptionNoSize', {
										sender: invite.sender_name,
										count: invite.file_count,
									})
							: ''}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="space-y-2 px-6 pb-4">
					<p className="text-xs font-medium text-muted-foreground">
						{t('common:receiver.nearbyInvite.unverifiedSender')}
					</p>
					{fingerprint ? (
						<div className="space-y-1 rounded-md border bg-muted/30 px-3 py-2">
							<p className="text-xs font-medium text-muted-foreground">
								{t('common:receiver.nearbyInvite.fingerprintLabel')}
							</p>
							<p className="font-mono text-sm tracking-wide">{fingerprint}</p>
							<p className="text-xs text-muted-foreground">
								{t('common:receiver.nearbyInvite.fingerprintHint', {
									sender: invite?.sender_name ?? '',
								})}
							</p>
						</div>
					) : invite ? (
						<p className="text-xs text-destructive">
							{t('common:receiver.nearbyInvite.fingerprintUnavailable')}
						</p>
					) : null}
				</div>
				<AlertDialogFooter>
					<AlertDialogClose
						render={
							<Button size="sm" variant="outline">
								{t('common:receiver.declineInvite')}
							</Button>
						}
						onClick={decline}
					/>
					<Button size="sm" disabled={!canAccept} onClick={() => void accept()}>
						{t('common:receiver.acceptInvite')}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
