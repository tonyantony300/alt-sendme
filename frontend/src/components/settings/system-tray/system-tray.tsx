import { useTranslation } from '../../../i18n'
import { IS_MACOS, IS_WINDOWS } from '@/lib/platform'
import { Frame, FrameHeader, FramePanel, FrameTitle } from '../../ui/frame'
import { ContextMenuToggle } from './context-menu-toggle'
import { MinimizeSystemTray } from './minimize-system-tray'
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
				{/* `ShowProgressOnIcon` is deliberately not rendered: nothing
				    implements progress-on-icon yet, so the switch only wrote a
				    value no code reads. The component and its `showProgressOnIcon`
				    setting are kept so restoring it is a one-line change once
				    the dock/taskbar progress feature exists. */}
				{IS_WINDOWS && <ContextMenuToggle />}
			</FramePanel>
		</Frame>
	)
}
