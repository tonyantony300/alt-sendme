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
				{/* macOS never quits on window close, so there is nothing to decide. */}
				{!IS_MACOS && <MinimizeSystemTray />}
				{/* `ShowProgressOnIcon` is not rendered — nothing implements
				    progress-on-icon yet. Kept so restoring it is a one-liner. */}
				{IS_WINDOWS && <ContextMenuToggle />}
			</FramePanel>
		</Frame>
	)
}
