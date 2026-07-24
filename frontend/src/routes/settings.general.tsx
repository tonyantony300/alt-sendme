import MobileSettingSidebar from '../components/setting-sidebar/mobile-setting-sidebar'
import { AutoUpdate } from '../components/settings/auto-update'
import { BroadcastSettings } from '../components/settings/broadcast'
import { SystemTray } from '../components/settings/system-tray/system-tray'
import { useTranslation } from '../i18n'
import { IS_DESKTOP, IS_TAURI } from '@/lib/platform'

export function SettingGeneralPage() {
	const { t } = useTranslation()
	return (
		<>
			<MobileSettingSidebar>
				{t('settings.navItems.general')}
			</MobileSettingSidebar>
			<BroadcastSettings />
			{IS_DESKTOP && <SystemTray />}
			{IS_TAURI && <AutoUpdate />}
		</>
	)
}
