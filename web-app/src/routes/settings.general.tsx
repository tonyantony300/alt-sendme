import MobileSettingSidebar from '../components/setting-sidebar/mobile-setting-sidebar'
import { AutoUpdate } from '../components/settings/auto-update'
import { SystemTray } from '../components/settings/system-tray/system-tray'

export function SettingGeneralPage() {
	return (
		<>
			<MobileSettingSidebar>General</MobileSettingSidebar>
			<SystemTray />
			<AutoUpdate />
		</>
	)
}
