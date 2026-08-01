import MobileSettingSidebar from '../components/setting-sidebar/mobile-setting-sidebar'
import { DiscoverySettings, RelaySettings } from '../components/settings/relay'
import { DiscoverabilitySetting } from '../components/settings/discoverability'
import { useTranslation } from '../i18n'

export function SettingNetworkPage() {
	const { t } = useTranslation()
	return (
		<>
			<MobileSettingSidebar>
				{t('settings.navItems.infra')}
			</MobileSettingSidebar>
			<DiscoverabilitySetting />
			<RelaySettings />
			<DiscoverySettings />
		</>
	)
}
