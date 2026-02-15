import type { ButtonProps } from '@base-ui/react'
import ReactCountryFlag from 'react-country-flag'
import {
	Combobox,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxPopup,
	ComboboxTrigger,
	ComboboxValue,
} from '@/components/ui/combobox'
import { useTranslation } from '../i18n'
import { useAppTranslation } from '../i18n/hooks'
import { cn } from '../lib/utils'
import { LazyIcon } from './icons'
import { buttonVariants } from './ui/button'

const LANGUAGES = [
	{ value: 'ar', label: 'العربية', countryCode: 'SA' },
	{ value: 'bn', label: 'বাংলা', countryCode: 'BD' },
	{ value: 'cs', label: 'Čeština', countryCode: 'CZ' },
	{ value: 'de', label: 'Deutsch', countryCode: 'DE' },
	{ value: 'en', label: 'English', countryCode: 'US' },
	{ value: 'es', label: 'Español', countryCode: 'ES' },
	{ value: 'fa', label: 'فارسی', countryCode: 'IR' },
	{ value: 'fr', label: 'Français', countryCode: 'FR' },
	{ value: 'hi', label: 'हिन्दी', countryCode: 'IN' },
	{ value: 'hu', label: 'Magyar', countryCode: 'HU' },
	{ value: 'it', label: 'Italiano', countryCode: 'IT' },
	{ value: 'ja', label: '日本語', countryCode: 'JP' },
	{ value: 'ko', label: '한국어', countryCode: 'KR' },
	{ value: 'no', label: 'Norsk', countryCode: 'NO' },
	{ value: 'pl', label: 'Polski', countryCode: 'PL' },
	{ value: 'pt-BR', label: 'Português', countryCode: 'BR' },
	{ value: 'ru', label: 'Русский', countryCode: 'RU' },
	{ value: 'sr', label: 'Српски', countryCode: 'RS' },
	{ value: 'th', label: 'Thai', countryCode: 'TH' },
	{ value: 'tr', label: 'Türkçe', countryCode: 'TR' },
	{ value: 'uk', label: 'Українська', countryCode: 'UA' },
	{ value: 'zh-CN', label: '简体中文', countryCode: 'CN' },
	{ value: 'zh-TW', label: '繁體中文', countryCode: 'TW' },
]

export function LanguageSwitcher(props: ButtonProps) {
	const { i18n } = useAppTranslation()
	const { t } = useTranslation()

	const currentLanguage =
		LANGUAGES.find((lang) => lang.value === i18n.language) || LANGUAGES[0]

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng)
		window.dispatchEvent(new Event('languagechange'))
	}

	return (
		<Combobox
			items={LANGUAGES}
			value={currentLanguage}
			defaultInputValue={''}
			onValueChange={(item) => {
				return item && changeLanguage(item?.value)
			}}
		>
			<ComboboxTrigger
				aria-label="Select an item"
				{...props}
				className={cn(
					buttonVariants({ variant: 'outline' }),
					'justify-between',
					props.className
				)}
			>
				<ComboboxValue />
				<LazyIcon name="CaretDown" className="-me-1 text-muted-foreground" />
			</ComboboxTrigger>
			<ComboboxPopup>
				<div className="border-b p-2">
					<ComboboxInput
						className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
						placeholder="e.g. English"
						showTrigger={false}
						startAddon={
							<LazyIcon
								name="MagnifyingGlass"
								className="mx-2 text-muted-foreground"
							/>
						}
					/>
				</div>
				<ComboboxEmpty className="gap-4">
					<LazyIcon
						name="FunnelSimpleX"
						weight="duotone"
						size="48"
						className="text-muted-foreground opacity-50"
					/>
					{t('settings.language.noResults')}
				</ComboboxEmpty>
				<ComboboxList>
					{(item: { value: string; label: string; countryCode?: string }) => (
						<ComboboxItem key={item.value} value={item}>
							{item.countryCode && (
								<ReactCountryFlag
									countryCode={item.countryCode}
									svg
									style={{
										width: '1.5em',
										height: '1.5em',
										verticalAlign: 'middle',
										marginRight: '0.5em',
										borderRadius: '0.25em',
									}}
								/>
							)}
							{item.label}
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxPopup>
		</Combobox>
	)
}
