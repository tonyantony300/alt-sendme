import MobileSettingSidebar from '../components/setting-sidebar/mobile-setting-sidebar'
import { AutoUpdate } from '../components/settings/auto-update'
import { BroadcastSettings } from '../components/settings/broadcast'
import { DebugMode } from '../components/settings/debug-mode'
import { Notifications } from '../components/settings/notifications'
import { SystemTray } from '../components/settings/system-tray/system-tray'
import { TransferHistorySettings } from '../components/settings/transfer-history'
import { useTranslation } from '../i18n'
import { IS_DESKTOP, IS_FLATPAK, IS_TAURI } from '@/lib/platform'

export function SettingGeneralPage() {
	const { t } = useTranslation()
	return (
		<>
			<MobileSettingSidebar>
				{t('settings.navItems.general')}
			</MobileSettingSidebar>
			<BroadcastSettings />
			{IS_TAURI && <Notifications />}
			{IS_DESKTOP && <SystemTray />}
			{IS_TAURI && <TransferHistorySettings />}
			{IS_TAURI && !IS_FLATPAK && <AutoUpdate />}
			<DebugMode />
		</>
	)
}
