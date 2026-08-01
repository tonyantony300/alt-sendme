import { useTranslation } from '../../../i18n'
import { IS_MACOS, IS_WINDOWS } from '@/lib/platform'
import { Frame, FrameHeader, FramePanel, FrameTitle } from '../../ui/frame'
import { ContextMenuToggle } from './context-menu-toggle'
import { MinimizeSystemTray } from './minimize-system-tray'
import { ShowProgressOnIcon } from './show-progress-on-icon'
import { StartOnStartup } from './start-on-startup'

export function SystemTray() {
	const { t } = useTranslation()
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{t('settings.general.systembar.title')}</FrameTitle>
			</FrameHeader>
			<FramePanel className="space-y-4">
				<StartOnStartup />
				{/* macOS never quits on window close — platform convention, so
				    there is nothing here for the user to decide. */}
				{!IS_MACOS && <MinimizeSystemTray />}
				<ShowProgressOnIcon />
				{IS_WINDOWS && <ContextMenuToggle />}
			</FramePanel>
		</Frame>
	)
}
