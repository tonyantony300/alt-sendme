import { Laptop2, type LucideIcon, Moon, Sun } from 'lucide-react'
import {
	Select,
	SelectItem,
	SelectPopup,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { useIsMobile } from '@/hooks/use-mobile'
import type { AppTheme } from '@/types/app'
import { useTranslation } from '../../../i18n'
import { useThemeStore } from '../../../store'
import { Frame, FrameHeader, FramePanel, FrameTitle } from '../../ui/frame'
import { ThemeSelectRadioItem } from './theme-select-radio-item'

const AppThemes: Array<{ icon: LucideIcon; label: string; value: AppTheme }> = [
	{ icon: Moon, label: 'Dark', value: 'dark' },
	{ icon: Sun, label: 'Light', value: 'light' },
	{ icon: Laptop2, label: 'Auto', value: 'auto' },
]

const AppThemesMap = AppThemes.reduce(
	(total, current) => {
		total[current.value] = current
		return total
	},
	{} as { [_ in AppTheme]: (typeof AppThemes)[number] }
)

export function ThemeSelectRadio() {
	const { activeTheme, themes, setTheme } = useThemeStore()
	const { t } = useTranslation()
	const isMobile = useIsMobile()

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{t('settings.theme.title')}</FrameTitle>
			</FrameHeader>
			<FramePanel className="flex flex-wrap justify-center gap-4 sm:gap-6 sm:justify-start">
				{isMobile ? (
					<Select
						items={AppThemes}
						value={AppThemesMap[activeTheme]}
						itemToStringValue={(item) => item.value}
						onValueChange={(theme) => {
							if (theme) setTheme(theme.value)
						}}
					>
						<SelectTrigger>
							<SelectValue>
								{(theme) => (
									<span className="flex items-center gap-2">
										<theme.icon />
										<span className="truncate">{theme.label}</span>
									</span>
								)}
							</SelectValue>
						</SelectTrigger>
						<SelectPopup>
							{AppThemes.map((theme) => (
								<SelectItem key={theme.value} value={theme}>
									<span className="flex items-center gap-2">
										<theme.icon />
										<span className="truncate">{theme.label}</span>
									</span>
								</SelectItem>
							))}
						</SelectPopup>
					</Select>
				) : (
					themes.map((theme) => (
						<ThemeSelectRadioItem
							key={theme}
							theme={theme}
							isSelected={activeTheme === theme}
							onSelect={setTheme}
						/>
					))
				)}
			</FramePanel>
		</Frame>
	)
}
