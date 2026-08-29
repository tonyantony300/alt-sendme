import { useTranslation } from '../../i18n'
import { useUpdaterStore } from '../../store/updater-store'
import { useInstallUpdate } from '../../hooks/use-updater'
import { LazyIcon } from '../icons'
import { IS_FLATPAK } from '../../lib/platform'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'

export function SettingSidebarUpdateAlert() {
	const { t } = useTranslation()
	const phase = useUpdaterStore((s) => s.phase)
	const version = useUpdaterStore((s) => s.version)
	const bannerVisible = useUpdaterStore((s) => s.bannerVisible)
	const { install } = useInstallUpdate()

	// Only speaks up for an update the banner is no longer showing — i.e. one
	// the user dismissed. Otherwise this was a second prompt for the same thing.
	if (IS_FLATPAK || phase !== 'available' || bannerVisible) {
		return null
	}

	return (
		<div className="px-2 mb-4">
			<Alert variant="success">
				<LazyIcon name="Info" />
				<AlertTitle>{t('updater.newUpdateTitle')}</AlertTitle>
				<AlertDescription>
					{t('updater.newVersionAvailable', { version: version ?? '' })}
				</AlertDescription>
				<div className="col-span-full pt-2 flex-1 flex justify-end">
					<Button size="xs" variant="outline" onClick={() => void install()}>
						{t('updater.updateNow')}
					</Button>
				</div>
			</Alert>
		</div>
	)
}
