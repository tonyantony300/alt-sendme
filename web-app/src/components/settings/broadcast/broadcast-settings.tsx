import { useTranslation } from '../../../i18n'
import { Frame, FrameHeader, FramePanel, FrameTitle } from '../../ui/frame'
import { ShowBroadcastToggle } from './show-broadcast-toggle'

export function BroadcastSettings() {
	const { t } = useTranslation()

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{t('settings.general.broadcast.title')}</FrameTitle>
			</FrameHeader>
			<FramePanel>
				<ShowBroadcastToggle />
			</FramePanel>
		</Frame>
	)
}
