import MobileSettingSidebar from '../components/setting-sidebar/mobile-setting-sidebar'
import { AutoUpdate } from '../components/settings/auto-update'
import { BroadcastSettings } from '../components/settings/broadcast'
import { DebugMode } from '../components/settings/debug-mode'
import { Notifications } from '../components/settings/notifications'
import { RelayStatusSettings } from '../components/settings/relay-status'
import { SystemTray } from '../components/settings/system-tray/system-tray'
import { TransferHistorySettings } from '../components/settings/transfer-history'
import { useTranslation } from '../i18n'
import {
	IS_ANDROID_UPDATE_CHECK_ENABLED,
	IS_DESKTOP,
	IS_FLATPAK,
	IS_TAURI,
} from '@/lib/platform'

// Flatpak updates through `flatpak update`, and a Play Store build through
// Play — neither has anything for this card to do.
const UPDATER_AVAILABLE =
	(IS_DESKTOP && !IS_FLATPAK) || IS_ANDROID_UPDATE_CHECK_ENABLED

export function SettingGeneralPage() {
	const { t } = useTranslation()
	return (
		<>
			<MobileSettingSidebar>
				{t('settings.navItems.general')}
			</MobileSettingSidebar>
			<BroadcastSettings />
			<RelayStatusSettings />
			{IS_TAURI && <Notifications />}
			{IS_DESKTOP && <SystemTray />}
			{IS_TAURI && <TransferHistorySettings />}
			{UPDATER_AVAILABLE && <AutoUpdate />}
			<DebugMode />
		</>
	)
}
