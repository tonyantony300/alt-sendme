import { FrameHeader, FrameTitle, FramePanel, Frame } from '../../ui/frame'
import { ThemeSelectRadioItem } from './theme-select-radio-item'
import { useThemeStore } from '../../../store'
import { useTranslation } from '../../../i18n'

export function ThemeSelectRadio() {
	const { activeTheme, themes, setTheme } = useThemeStore()
	const { t } = useTranslation()

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{t('settings.theme.title')}</FrameTitle>
			</FrameHeader>
			<FramePanel className="flex flex-wrap gap-6 justify-start">
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
