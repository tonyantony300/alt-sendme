import { useEffect, useState } from 'react'
import { useTranslation } from '@/i18n'
import { isAutostartEnabled, setAutostart } from '@/lib/autostart'
import { IS_DESKTOP } from '@/lib/platform'
import { listen } from '@/lib/platform-api'
import { useAppSettingStore } from '@/store/app-setting'
import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../ui/alert-dialog'
import { Button } from '../ui/button'

type DevicePairedPayload = { display_name?: string | null }

/**
 * Asked once, after the user's first successful pairing — the first moment
 * "stay online" means anything to them. Deliberately not shown at first run,
 * and never shown again regardless of the answer.
 */
export function AutostartPrompt() {
	const { t } = useTranslation()
	const [peerName, setPeerName] = useState<string | null>(null)
	const seen = useAppSettingStore((s) => s.autostartPromptSeen)
	const setSeen = useAppSettingStore((s) => s.setAutostartPromptSeen)

	useEffect(() => {
		if (!IS_DESKTOP || seen) return

		let disposed = false
		let unlisten: (() => void) | undefined

		const setup = async () => {
			const stop = await listen(
				'device-paired',
				(event: { payload: unknown }) => {
					void (async () => {
						// Never nag someone who already turned it on. `null` means
						// the platform can't be asked (Flatpak) — fall back to the
						// persisted value rather than treating unknown as "off".
						const reported = await isAutostartEnabled().catch(() => true)
						const already =
							reported ?? useAppSettingStore.getState().startOnBoot
						if (disposed || already) return
						let name: string | null = null
						try {
							const payload = JSON.parse(
								String(event.payload)
							) as DevicePairedPayload
							name = payload.display_name?.trim() || null
						} catch {
							// Payload is optional for this prompt; fall back below.
						}
						setPeerName(name ?? t('common:sender.pairedDevices.unknownPeer'))
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
	}, [seen, t])

	const close = () => {
		setPeerName(null)
		setSeen(true)
	}

	const confirm = () => {
		void setAutostart(true).catch(() => {
			// Failure is visible in Settings; nothing useful to say here.
		})
		close()
	}

	if (!IS_DESKTOP) return null

	return (
		<AlertDialog
			open={peerName != null}
			onOpenChange={(open) => {
				if (!open) close()
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t('common:settings.autostartPrompt.title')}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t('common:settings.autostartPrompt.description', {
							name: peerName ?? '',
						})}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose
						render={
							<Button size="sm" variant="outline">
								{t('common:settings.autostartPrompt.dismiss')}
							</Button>
						}
						onClick={close}
					/>
					<Button size="sm" onClick={confirm}>
						{t('common:settings.autostartPrompt.confirm')}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
