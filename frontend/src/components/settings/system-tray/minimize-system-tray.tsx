import { useTranslation } from '../../../i18n'
import { IS_DESKTOP } from '@/lib/platform'
import { invoke } from '@/lib/platform-api'
import { useAppSettingStore } from '../../../store/app-setting'
import { FrameDescription, FrameTitle } from '../../ui/frame'
import { Switch } from '../../ui/switch'

export function MinimizeSystemTray() {
	const { t } = useTranslation()
	const minimizeToTray = useAppSettingStore((state) => state.minimizeToTray)
	const setMinimizeToTray = useAppSettingStore(
		(state) => state.setMinimizeToTray
	)

	const toggle = (next: boolean) => {
		setMinimizeToTray(next)
		if (IS_DESKTOP) {
			// The close handler reads a Rust-side flag, not this store.
			void invoke('set_background_on_close', { enabled: next }).catch(() => {
				// Non-fatal: the flag is re-seeded from the store file at startup.
			})
		}
	}

	return (
		<div className="flex items-center justify-between">
			<div className="flex-1">
				<FrameTitle>
					{t('settings.general.systembar.minimizeToTray.label')}
				</FrameTitle>
				<FrameDescription>
					{t('settings.general.systembar.minimizeToTray.description')}
				</FrameDescription>
			</div>
			<Switch checked={minimizeToTray} onCheckedChange={toggle} />
		</div>
	)
}
