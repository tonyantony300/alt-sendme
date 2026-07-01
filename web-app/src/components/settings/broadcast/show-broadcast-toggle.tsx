import { useTranslation } from '../../../i18n'
import { useAppSettingStore } from '../../../store/app-setting'
import { FrameDescription, FrameTitle } from '../../ui/frame'
import { Switch } from '../../ui/switch'

export function ShowBroadcastToggle() {
	const { t } = useTranslation()
	const showBroadcastToggle = useAppSettingStore(
		(state) => state.showBroadcastToggle
	)
	const setShowBroadcastToggle = useAppSettingStore(
		(state) => state.setShowBroadcastToggle
	)

	return (
		<div className="flex items-center justify-between">
			<div className="flex-1">
				<FrameTitle>
					{t('settings.general.broadcast.showToggle.label')}
				</FrameTitle>
				<FrameDescription>
					{t('settings.general.broadcast.showToggle.description')}
				</FrameDescription>
			</div>
			<Switch
				checked={showBroadcastToggle}
				onCheckedChange={setShowBroadcastToggle}
			/>
		</div>
	)
}
