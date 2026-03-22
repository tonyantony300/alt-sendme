import { useTranslation } from '../../../i18n'
import { useThemeStore } from '../../../store'
import { Frame, FrameHeader, FramePanel, FrameTitle } from '../../ui/frame'
import { ThemeSelectRadioItem } from './theme-select-radio-item'

export function ThemeSelectRadio() {
	const { activeTheme, themes, setTheme } = useThemeStore()
	const { t } = useTranslation()

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{t('settings.theme.title')}</FrameTitle>
			</FrameHeader>
			<FramePanel className="flex flex-wrap justify-center gap-4 sm:gap-6 sm:justify-start">
				{themes.map((theme) => (
					<ThemeSelectRadioItem
						key={theme}
						theme={theme}
						isSelected={activeTheme === theme}
						onSelect={setTheme}
					/>
				))}
			</FramePanel>
		</Frame>
	)
}
