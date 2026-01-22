import { useAppTranslation } from '../i18n/hooks'
import { Select, SelectValue, SelectContent, SelectItem } from './ui/select'
import { buttonVariants } from './ui/button'
import type { ButtonProps } from '@base-ui/react'
import { Select as RootSelect } from '@base-ui/react/select'
import { cn } from '@/lib/utils'

const LANGUAGES = [
	{ value: 'en', label: 'English' },
	{ value: 'ru', label: 'Русский' },
	{ value: 'sr', label: 'Српски' },
	{ value: 'fr', label: 'Français' },
	{ value: 'zh-CN', label: '简体中文' },
	{ value: 'zh-TW', label: '繁體中文' },
	{ value: 'de', label: 'Deutsch' },
	{ value: 'ja', label: '日本語' },
	{ value: 'th', label: 'Thai' },
	{ value: 'it', label: 'Italiano' },
	{ value: 'cs', label: 'Čeština' },
	{ value: 'es', label: 'Español' },
	{ value: 'pt-BR', label: 'Português' },
	{ value: 'ar', label: 'العربية' },
	{ value: 'fa', label: 'فارسی' },
	{ value: 'ko', label: '한국어' },
	{ value: 'hi', label: 'हिन्दी' },
	{ value: 'pl', label: 'Polski' },
	{ value: 'uk', label: 'Українська' },
	{ value: 'tr', label: 'Türkçe' },
	{ value: 'no', label: 'Norsk' },
	{ value: 'bn', label: 'বাংলা' },
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
			<SelectContent>
				{LANGUAGES.map((lang) => (
					<SelectItem value={lang} key={lang.value}>
						{lang.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
