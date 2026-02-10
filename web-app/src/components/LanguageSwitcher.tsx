import { useAppTranslation } from '../i18n/hooks'
import { Select, SelectValue, SelectContent, SelectItem } from './ui/select'
import { buttonVariants } from './ui/button'
import type { ButtonProps } from '@base-ui/react'
import { Select as RootSelect } from '@base-ui/react/select'
import { cn } from '@/lib/utils'

const LANGUAGES = [
	{ value: 'ar', label: 'العربية' },
	{ value: 'bn', label: 'বাংলা' },
	{ value: 'cs', label: 'Čeština' },
	{ value: 'de', label: 'Deutsch' },
	{ value: 'en', label: 'English' },
	{ value: 'es', label: 'Español' },
	{ value: 'fa', label: 'فارسی' },
	{ value: 'fr', label: 'Français' },
	{ value: 'hi', label: 'हिन्दी' },
	{ value: 'hu', label: 'Magyar' },
	{ value: 'it', label: 'Italiano' },
	{ value: 'ja', label: '日本語' },
	{ value: 'ko', label: '한국어' },
	{ value: 'no', label: 'Norsk' },
	{ value: 'pl', label: 'Polski' },
	{ value: 'pt-BR', label: 'Português' },
	{ value: 'ru', label: 'Русский' },
	{ value: 'sr', label: 'Српски' },
	{ value: 'th', label: 'Thai' },
	{ value: 'tr', label: 'Türkçe' },
	{ value: 'uk', label: 'Українська' },
	{ value: 'zh-CN', label: '简体中文' },
	{ value: 'zh-TW', label: '繁體中文' },
  ]

export function LanguageSwitcher(props: ButtonProps) {
	const { i18n } = useAppTranslation()

	const currentLanguage =
		LANGUAGES.find((lang) => lang.value === i18n.language) || LANGUAGES[0]

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng)
		window.dispatchEvent(new Event('languagechange'))
	}

	return (
		<Select
			// items={LANGUAGES}
			value={currentLanguage}
			onValueChange={(item) => {
				return item && changeLanguage(item?.value)
			}}
		>
			<RootSelect.Trigger
				{...props}
				className={cn(
					buttonVariants({ variant: 'ghost', size: 'sm' }),
					props.className
				)}
			>
				<SelectValue />
			</RootSelect.Trigger>
			<SelectContent sideOffset={10} className="max-h-[30vh]">
				{LANGUAGES.map((lang) => (
					<SelectItem value={lang} key={lang.value}>
						{lang.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
