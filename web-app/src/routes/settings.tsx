import { ThemeSelectRadio } from '../components/settings/theme-select-radio/theme-select-radio'
import { LanguageSelect } from '../components/settings/language-select/language-select'
import MobileSettingSidebar from '../components/setting-sidebar/mobile-setting-sidebar'
import { useTranslation } from '../i18n'

export function SettingsPage() {
	const { t } = useTranslation()
	return (
		<>
			<MobileSettingSidebar>
				{t('settings.navItems.appearance')}
			</MobileSettingSidebar>

			<LanguageSelect />
			<LanguageSelect />
			<LanguageSelect />
			<LanguageSelect />
			<LanguageSelect />
			<LanguageSelect />
			<LanguageSelect />
			<ThemeSelectRadio />
		</>
	)
}
