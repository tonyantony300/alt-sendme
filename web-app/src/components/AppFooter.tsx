import { buttonVariants } from './ui/button'
import { CoffeeIcon, GithubIcon, GlobeIcon, SettingsIcon } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { DONATE_LINK, VERSION_DISPLAY } from '@/lib/version'
import { Separator } from './ui/separator'
import { Link } from 'react-router-dom'
import { handleExternalLinkClick } from '@/lib/openExternalUrl'
import { RelayStatusButton } from './RelayStatusButton'

const CONTACTS = [
	{
		link: 'https://github.com/tonyantony300/alt-sendme',
		icon: <GithubIcon />,
		'aria-label': 'Github source code',
	},
	{
		link: DONATE_LINK,
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
		<div className="w-full h-10 items-center bottom-0 flex px-4 bg-background/50 border-t border-border backdrop-blur-md py-4">
			<div className="space-x-2 flex-1 w-full flex items-center">
				<span className="text-sm text-muted-foreground ml-1">
					{VERSION_DISPLAY}
				</span>
				<Separator className="h-6" orientation="vertical" />

				{CONTACTS.map((contact) => (
					<a
						key={contact.link}
						href={contact.link}
						onClick={(event) => handleExternalLinkClick(event, contact.link)}
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
			<div className="flex flex-1 items-center justify-end gap-2">
				<RelayStatusButton />
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
