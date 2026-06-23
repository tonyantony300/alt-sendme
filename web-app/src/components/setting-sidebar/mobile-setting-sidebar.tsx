import type { FC } from 'react'
import type React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useTranslation } from '../../i18n'
import { useSidebar } from '../ui/sidebar'
import { Button } from '../ui/button'
import { BackArrowIcon } from '../back-arrow-icon'
import { LazyIcon } from '../icons'

type MobileSettingSidebarProps = React.ComponentPropsWithoutRef<'div'>

const MobileSettingSidebar: FC<MobileSettingSidebarProps> = ({
	className,
	...rest
}) => {
	const { isMobile, toggleSidebar } = useSidebar()
	const { t } = useTranslation()

	return (
		<>
			<header
				className={cn(
					isMobile ? 'flex' : 'hidden',
					'gap-2 py-2.5 border-b fixed border-border inset-x-0 top-0 items-center bg-muted backdrop-blur-md z-10 px-3',
					className
				)}
				{...rest}
			>
				<Link
					to="/"
					className="inline-flex items-center gap-0.5 -ml-1 px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
					aria-label={t('notFound.goHome')}
				>
					<BackArrowIcon size={16} />
					<span>{t('notFound.goBack')}</span>
				</Link>
				<Button size="icon-sm" variant="ghost" onClick={toggleSidebar}>
					<LazyIcon name="Sidebar" weight={'fill'} />
				</Button>
				<div className="text-lg font-medium">{rest.children}</div>
			</header>
			{isMobile && (
				<div className="h-8" data-slot="header-slot">
					&nbsp;
				</div>
			)}
		</>
	)
}

export default MobileSettingSidebar
