import { useTranslation } from '../../../i18n'
import { useAppSettingStore } from '../../../store/app-setting'
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from '../../ui/frame'
import { Switch } from '../../ui/switch'

export function Notifications() {
	const { t } = useTranslation()
	const enabled = useAppSettingStore((state) => state.enableNotifications)
	const setEnabled = useAppSettingStore((state) => state.setEnableNotifications)

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{t('settings.general.notifications.title')}</FrameTitle>
			</FrameHeader>
			<FramePanel className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex-1">
						<FrameTitle>{t('settings.general.notifications.label')}</FrameTitle>
						<FrameDescription>
							{t('settings.general.notifications.description')}
						</FrameDescription>
					</div>
					<Switch checked={enabled} onCheckedChange={setEnabled} />
				</div>
			</FramePanel>
		</Frame>
	)
}
