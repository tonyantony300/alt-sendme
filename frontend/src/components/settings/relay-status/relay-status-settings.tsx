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

export function RelayStatusSettings() {
	const { t } = useTranslation()
	const showRelayStatus = useAppSettingStore((state) => state.showRelayStatus)
	const setShowRelayStatus = useAppSettingStore(
		(state) => state.setShowRelayStatus
	)

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{t('settings.general.relayStatus.title')}</FrameTitle>
			</FrameHeader>
			<FramePanel>
				<div className="flex items-center justify-between">
					<div className="flex-1">
						<FrameTitle>
							{t('settings.general.relayStatus.showToggle.label')}
						</FrameTitle>
						<FrameDescription>
							{t('settings.general.relayStatus.showToggle.description')}
						</FrameDescription>
					</div>
					<Switch
						checked={showRelayStatus}
						onCheckedChange={setShowRelayStatus}
					/>
				</div>
			</FramePanel>
		</Frame>
	)
}
