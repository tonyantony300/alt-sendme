import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useAppSettingStore } from '../../../store/app-setting'
import { useUpdaterStore } from '../../../store/updater-store'
import { Button } from '../../ui/button'
import {
	FrameTitle,
	FrameDescription,
	Frame,
	FramePanel,
	FrameFooter,
} from '../../ui/frame'
import { Switch } from '../../ui/switch'
import {
	useCheckForUpdatesMutation,
	useInstallUpdate,
} from '../../../hooks/use-updater'
import { useIsWindowsPortable } from '../../../hooks/use-windows-portable'
import { UpdateProgressBar } from '../../common/update-progress'
import { toastManager } from '../../ui/toast'

export function AutoUpdate() {
	const { t } = useTranslation()
	const value = useAppSettingStore((r) => r.autoUpdate)
	const toggle = useAppSettingStore((r) => r.setAutoUpdate)
	const { data: isPortable = false } = useIsWindowsPortable()

	const phase = useUpdaterStore((s) => s.phase)
	const version = useUpdaterStore((s) => s.version)
	const downloadedBytes = useUpdaterStore((s) => s.downloadedBytes)
	const contentLength = useUpdaterStore((s) => s.contentLength)
	const progressRatio = useUpdaterStore((s) => s.progressRatio)
	const downloadUrl = useUpdaterStore((s) => s.downloadUrl)

	const checkForUpdates = useCheckForUpdatesMutation()
	const { install, restart } = useInstallUpdate()

	const handleCheckForUpdates = () => {
		checkForUpdates.mutate(undefined, {
			onSuccess: (update) => {
				if (!update) {
					toastManager.add({
						title: t('updater.noUpdatesTitle'),
						description: t('updater.noUpdatesDescription'),
						type: 'info',
					})
				}
			},
		})
	}

	if (isPortable) {
		return (
			<Frame>
				<FramePanel>
					<FrameTitle>{t('updater.portableTitle')}</FrameTitle>
					<FrameDescription>
						{t('updater.portableDescription')}
					</FrameDescription>
				</FramePanel>
			</Frame>
		)
	}

	return (
		<Frame>
			<FramePanel className="flex items-center justify-between">
				<div className="flex-1">
					<FrameTitle>
						{t('settings.general.autoCheckUpdates.label')}
					</FrameTitle>
					<FrameDescription>
						{t('settings.general.autoCheckUpdates.description')}
					</FrameDescription>
				</div>
				<Switch checked={value} onCheckedChange={toggle} />
			</FramePanel>

			{/* Status lands inline; the update state lives in the store, so this and
			    the banner can never disagree or start two downloads. */}
			{phase !== 'idle' && (
				<FramePanel className="flex flex-col gap-3">
					<p className="text-sm text-muted-foreground">
						{phase === 'available' &&
							t('updater.newVersionAvailableInline', { version })}
						{phase === 'available' && downloadUrl
							? ` ${t('updater.sideloadHint')}`
							: null}
						{phase === 'downloading' &&
							t('updater.downloadingTitle', { version })}
						{phase === 'installing' && t('updater.installingTitle')}
						{phase === 'ready' && t('updater.readyTitle', { version })}
						{phase === 'restarting' && t('updater.restarting')}
					</p>

					{(phase === 'downloading' || phase === 'installing') && (
						<UpdateProgressBar
							downloadedBytes={downloadedBytes}
							contentLength={phase === 'downloading' ? contentLength : null}
							progressRatio={phase === 'downloading' ? progressRatio : null}
						/>
					)}

					{phase === 'available' && (
						<div className="flex justify-end">
							<Button size="sm" onClick={() => void install()}>
								{downloadUrl ? t('updater.download') : t('updater.updateNow')}
							</Button>
						</div>
					)}

					{phase === 'ready' && (
						<div className="flex justify-end">
							<Button size="sm" onClick={() => void restart()}>
								{t('updater.restartNow')}
							</Button>
						</div>
					)}
				</FramePanel>
			)}

			{value === false && (
				<FrameFooter className="flex-row justify-end">
					<Button
						className="w-48"
						variant="secondary"
						onClick={handleCheckForUpdates}
						disabled={checkForUpdates.isPending}
					>
						{checkForUpdates.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : null}
						{t('updater.checkForUpdates')}
					</Button>
				</FrameFooter>
			)}
		</Frame>
	)
}
