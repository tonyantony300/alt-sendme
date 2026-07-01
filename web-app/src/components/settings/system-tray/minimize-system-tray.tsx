import { useTranslation } from '../../../i18n'
import { useAppSettingStore } from '../../../store/app-setting'
import { FrameDescription, FrameTitle } from '../../ui/frame'
import { Switch } from '../../ui/switch'

export function MinimizeSystemTray() {
	const { t } = useTranslation()
	const minimizeToTray = useAppSettingStore((state) => state.minimizeToTray)
	const setMinimizeToTray = useAppSettingStore(
		(state) => state.setMinimizeToTray
	)
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
			<Switch checked={minimizeToTray} onCheckedChange={setMinimizeToTray} />
		</div>
	)
}
