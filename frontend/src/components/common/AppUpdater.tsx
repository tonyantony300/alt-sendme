import { useCallback, useEffect, useState } from 'react'
import { Gift, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n'
import { useAppSettingStore } from '@/store/app-setting'
import { useUpdaterStore } from '@/store/updater-store'
import { useInstallUpdate, useUpdaterSync } from '@/hooks/use-updater'
import { useTransferBusy } from '@/hooks/use-transfer-busy'
import { UpdateProgressBar } from './update-progress'

export function AppUpdater() {
	const { t } = useTranslation()
	const autoUpdate = useAppSettingStore((state) => state.autoUpdate)
	useUpdaterSync(autoUpdate)

	const phase = useUpdaterStore((s) => s.phase)
	const version = useUpdaterStore((s) => s.version)
	const bannerVisible = useUpdaterStore((s) => s.bannerVisible)
	const downloadUrl = useUpdaterStore((s) => s.downloadUrl)
	const downloadedBytes = useUpdaterStore((s) => s.downloadedBytes)
	const contentLength = useUpdaterStore((s) => s.contentLength)
	const progressRatio = useUpdaterStore((s) => s.progressRatio)
	const dismiss = useUpdaterStore((s) => s.dismiss)

	const { install, restart } = useInstallUpdate()
	const transferBusy = useTransferBusy()
	const [confirmingRestart, setConfirmingRestart] = useState(false)

	const canDismiss = phase === 'available'

	// Esc closes the banner the way any dismissible surface should. The old
	// AlertDialog swallowed Esc entirely.
	useEffect(() => {
		if (!bannerVisible || !canDismiss) return
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') dismiss()
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [bannerVisible, canDismiss, dismiss])

	const handleRestart = useCallback(() => {
		if (transferBusy && !confirmingRestart) {
			setConfirmingRestart(true)
			return
		}
		void restart()
	}, [transferBusy, confirmingRestart, restart])

	if (!bannerVisible) return null

	return (
		// Deliberately not a dialog: no backdrop, no focus trap, no viewport. The
		// rest of the window stays clickable while this sits in the corner.
		<section
			aria-label={t('updater.newUpdateTitle')}
			className="fixed bottom-3 left-3 z-40 w-[22rem] max-w-[calc(100vw-1.5rem)] rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg"
		>
			{canDismiss && (
				<Button
					variant="ghost"
					size="icon"
					className="absolute top-2 right-2 size-6 text-muted-foreground"
					aria-label={t('updater.dismiss')}
					onClick={dismiss}
				>
					<X className="size-3.5" />
				</Button>
			)}

			<div className="flex items-center gap-2 pr-6">
				<Gift className="size-4 shrink-0 text-muted-foreground" />
				<p aria-live="polite" className="text-sm text-muted-foreground">
					{phase === 'available' &&
						t('updater.newVersionAvailableInline', { version })}
					{phase === 'downloading' &&
						t('updater.downloadingTitle', { version })}
					{phase === 'installing' && t('updater.installingTitle')}
					{phase === 'ready' && t('updater.readyTitle', { version })}
					{phase === 'restarting' && t('updater.restarting')}
				</p>
			</div>

			{phase === 'downloading' && (
				<div className="mt-3">
					<UpdateProgressBar
						downloadedBytes={downloadedBytes}
						contentLength={contentLength}
						progressRatio={progressRatio}
					/>
				</div>
			)}

			{phase === 'installing' && (
				<div className="mt-3">
					<UpdateProgressBar
						downloadedBytes={downloadedBytes}
						contentLength={null}
						progressRatio={null}
					/>
				</div>
			)}

			{confirmingRestart && phase === 'ready' && (
				<p className="mt-2 text-destructive text-xs">
					{t('updater.restartBusyDescription')}
				</p>
			)}

			{phase === 'available' && (
				<div className="mt-3 flex justify-end gap-2">
					<Button variant="outline" size="sm" onClick={dismiss}>
						{t('updater.later')}
					</Button>
					<Button size="sm" onClick={() => void install()}>
						{downloadUrl ? t('updater.download') : t('updater.updateNow')}
					</Button>
				</div>
			)}

			{phase === 'ready' && (
				<div className="mt-3 flex justify-end gap-2">
					{confirmingRestart && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setConfirmingRestart(false)}
						>
							{t('updater.cancel')}
						</Button>
					)}
					<Button
						size="sm"
						variant={confirmingRestart ? 'destructive' : 'default'}
						onClick={handleRestart}
					>
						{confirmingRestart
							? t('updater.restartAnyway')
							: t('updater.restartNow')}
					</Button>
				</div>
			)}

			{phase === 'restarting' && (
				<div className="mt-3 flex justify-end">
					<Loader2 className="size-4 animate-spin text-muted-foreground" />
				</div>
			)}
		</section>
	)
}
