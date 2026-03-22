import {
	FrameHeader,
	FrameTitle,
	FramePanel,
	Frame,
	FrameDescription,
} from '../../ui/frame'
import { ThemeSelectRadioItem } from './theme-select-radio-item'
import { useThemeStore } from '../../../store'
import { useTranslation } from '../../../i18n'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectPopup,
	SelectItem,
} from '../../ui/select'
import type { AppTheme } from '../../../types/app'
import { LazyIcon } from '../../icons'

export function ThemeSelectRadio() {
	const { activeTheme, themes, setTheme } = useThemeStore()
	const { t } = useTranslation()

	const handleThemeChange = (value: string) => {
		setTheme(value as AppTheme)
	}

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>
					<LazyIcon
						name="Palette"
						weight="fill"
						size={20}
						className="inline-block mr-2 opacity-75 sm:hidden"
					/>

					{t('settings.theme.title')}
				</FrameTitle>
			</FrameHeader>
			<FramePanel className="flex flex-col gap-6">
				{/* Mobile view - Select dropdown */}
				<div className="md:hidden w-full space-y-1">
					<FrameDescription>{t('settings.theme.description')}</FrameDescription>
					<Select value={activeTheme}>
						<SelectTrigger size="default" className="w-full">
							<SelectValue
								className={'capitalize'}
								placeholder="Select a theme"
							/>
						</SelectTrigger>
						<SelectPopup>
							{themes.map((theme) => (
								<SelectItem
									key={theme}
									value={theme}
									onClick={() => handleThemeChange(theme)}
								>
									<span className="capitalize">{theme}</span>
								</SelectItem>
							))}
						</SelectPopup>
					</Select>
				</div>

				{/* Desktop view - Radio cards */}
				<div className="hidden md:flex flex-wrap gap-6 justify-start">
					{themes.map((theme) => (
						<ThemeSelectRadioItem
							key={theme}
							theme={theme}
							isSelected={activeTheme === theme}
							onSelect={setTheme}
						/>
					))}
				</div>
			</FramePanel>
		</Frame>
	)
}
