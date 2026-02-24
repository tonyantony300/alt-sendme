import { openUrl } from '@tauri-apps/plugin-opener'
import { CoffeeIcon, GithubIcon, GlobeIcon, SettingsIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from '@/i18n'
import { AppVersionInline } from './app-version'
import { buttonVariants } from './ui/button'

//import { Link } from 'react-router-dom'

const CONTACTS = [
	{
		link: 'https://github.com/tonyantony300/alt-sendme',
		icon: <GithubIcon />,
		'aria-label': 'Github source code',
	},
	{
		link: 'https://buymeacoffee.com/tny_antny',
		icon: <CoffeeIcon />,
		'aria-label': 'Buy me a coffee',
	},
	{
		link: 'https://www.altsendme.com/',
		icon: <GlobeIcon />,
		'aria-label': 'Alt SendMe website',
	},
]

export function AppFooter() {
	const { t } = useTranslation()
	return (
		<div className="w-full h-10 items-center justify-between bottom-0 flex px-4 bg-background/50 border-t border-border backdrop-blur-md py-4">
			<div className="gap-2 flex items-center relative">
				{CONTACTS.map((contact) => (
					<button
						type="button"
						key={contact.link}
						onClick={() => openUrl(contact.link)}
						title={contact['aria-label']}
						aria-label={contact['aria-label']}
						className={buttonVariants({
							size: 'icon-sm',
							variant: 'outline',
						})}
					>
						{contact.icon}
					</button>
				))}
			</div>
			<div>
				<AppVersionInline className="text-muted-foreground !no-underline" />
			</div>
			<div className="flex items-center gap-2">
				<Link
					to="/settings"
					className={buttonVariants({
						size: 'icon-sm',
						variant: 'outline',
					})}
					aria-label={t('settings.title')}
				>
					<SettingsIcon />
				</Link>
			</div>
		</div>
	)
}
