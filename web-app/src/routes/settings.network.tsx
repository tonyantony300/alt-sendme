import MobileSettingSidebar from '../components/setting-sidebar/mobile-setting-sidebar'
import { RelaySettings } from '../components/settings/relay'
import { useTranslation } from '../i18n'

export function SettingNetworkPage() {
	const { t } = useTranslation()
	return (
		<>
			<MobileSettingSidebar>
				{t('settings.navItems.relay')}
			</MobileSettingSidebar>
			<RelaySettings />
		</>
	)
}
