import { buttonVariants } from './ui/button'
import {
	CoffeeIcon,
	GithubIcon,
	GlobeIcon,
	MonitorSmartphone,
	SettingsIcon,
} from 'lucide-react'
import { useTranslation } from '@/i18n'
import {
	DONATE_LINK,
	GITHUB_REPO_LINK,
	VERSION_DISPLAY,
	WEBSITE_LINK,
} from '@/lib/version'
import { Separator } from './ui/separator'
import { Link } from 'react-router-dom'
import { handleExternalLinkClick } from '@/lib/openExternalUrl'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { useSenderStore } from '@/store/sender-store'
import { RelayStatusButton } from './RelayStatusButton'

const CONTACTS = [
	{
		link: GITHUB_REPO_LINK,
		icon: <GithubIcon />,
		'aria-label': 'Github source code',
	},
	{
		link: DONATE_LINK,
		icon: <CoffeeIcon />,
		'aria-label': 'Buy me a coffee',
	},
	{
		link: WEBSITE_LINK,
		icon: <GlobeIcon />,
		'aria-label': 'DashBeam website',
	},
]

export function AppFooter() {
	const { t } = useTranslation()
	const isSharing = useSenderStore(
		(s) => s.viewState === 'SHARING' || s.viewState === 'TRANSPORTING'
	)

	return (
		<div
			className="w-full min-h-10 items-center flex bg-background/50 border-t border-border backdrop-blur-md"
			style={{
				paddingTop: '0.5rem',
				paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
				paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
				paddingRight: 'calc(1rem + env(safe-area-inset-right))',
			}}
		>
			<div className="space-x-2 flex-1 w-full flex items-center">
				<span className="text-sm text-muted-foreground ml-1">
					{VERSION_DISPLAY}
				</span>
				<Separator className="hidden h-6 sm:block" orientation="vertical" />

				{CONTACTS.map((contact) => (
					<a
						key={contact.link}
						href={contact.link}
						onClick={(event) => handleExternalLinkClick(event, contact.link)}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={contact['aria-label']}
						className={cn(
							buttonVariants({
								size: 'icon-sm',
								variant: 'outline',
							}),
							'hidden sm:inline-flex'
						)}
					>
						{contact.icon}
					</a>
				))}
			</div>
			<div className="flex flex-1 items-center justify-end gap-2">
				{IS_PAIRING_CAPABLE ? (
					isSharing ? (
						<span
							aria-disabled
							className={cn(
								buttonVariants({
									variant: 'outline',
									size: 'sm',
								}),
								'pointer-events-none opacity-64 text-xs sm:text-sm'
							)}
						>
							<MonitorSmartphone />
							{t('common:sender.pairDevice')}
						</span>
					) : (
						<Link
							to="/settings/devices"
							className={cn(
								buttonVariants({
									variant: 'outline',
									size: 'sm',
								}),
								'text-xs sm:text-sm'
							)}
						>
							<MonitorSmartphone />
							{t('common:sender.pairDevice')}
						</Link>
					)
				) : null}
				<RelayStatusButton />
				{isSharing ? (
					<button
						type="button"
						disabled
						aria-label={t('settings.title')}
						className={cn(
							buttonVariants({
								size: 'icon-sm',
								variant: 'outline',
							}),
							'pointer-events-none opacity-64'
						)}
					>
						<SettingsIcon />
					</button>
				) : (
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
				)}
			</div>
		</div>
	)
}
