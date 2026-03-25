import { platform } from '@tauri-apps/plugin-os'
import { useTranslation } from '../../../i18n'
import { Frame, FrameHeader, FramePanel, FrameTitle } from '../../ui/frame'
import { ContextMenuToggle } from './context-menu-toggle'
import { MinimizeSystemTray } from './minimize-system-tray'
import { ShowProgressOnIcon } from './show-progress-on-icon'
import { StartOnStartup } from './start-on-startup'

const isWindows = platform() === 'windows'

export function SystemTray() {
	const { t } = useTranslation()
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{t('settings.general.systembar.title')}</FrameTitle>
			</FrameHeader>
			<FramePanel className="space-y-4">
				<MinimizeSystemTray />
				<ShowProgressOnIcon />
				<StartOnStartup />
				{isWindows && <ContextMenuToggle />}
			</FramePanel>
		</Frame>
	)
}
