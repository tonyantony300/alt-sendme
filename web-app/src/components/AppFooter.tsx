import { buttonVariants } from './ui/button'
import { CoffeeIcon, GithubIcon, GlobeIcon, SettingsIcon } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { AppVersion } from './AppVersionPayload'
import { Separator } from './ui/separator'
import { Link } from 'react-router-dom'
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
		<div className="w-full h-10 items-center justify-between  bottom-0 flex px-4 bg-background/50 border-t border-border backdrop-blur-md py-4">
			<div className="space-x-2 flex-1 w-full flex items-center relative">
				<AppVersion />
				<Separator className="h-6" orientation="vertical" />

				{CONTACTS.map((contact) => (
					<a
						key={contact.link}
						href={contact.link}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={contact['aria-label']}
						className={buttonVariants({
							size: 'icon-sm',
							variant: 'outline',
						})}
					>
						{contact.icon}
					</a>
				))}
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
