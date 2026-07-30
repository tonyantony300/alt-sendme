import type { FC } from 'react'
import type React from 'react'
import { IS_LINUX, IS_WEB } from '@/lib/platform'
import { cn } from '../../lib/utils'
import { useSidebar } from '../ui/sidebar'
import { Button } from '../ui/button'
import { LazyIcon } from '../icons'

const LINUX_TITLE_BAR_HEIGHT = '2.5rem'

type MobileSettingSidebarProps = React.ComponentPropsWithoutRef<'div'>

const MobileSettingSidebar: FC<MobileSettingSidebarProps> = ({
	className,
	...rest
}) => {
	const { isMobile, toggleSidebar } = useSidebar()

	return (
		<>
			<header
				className={cn(
					isMobile ? 'flex' : 'hidden',
					'gap-2 border-b border-border items-center bg-muted backdrop-blur-md z-10',
					IS_WEB ? 'sticky top-0' : 'fixed inset-x-0',
					className
				)}
				style={{
					top: IS_WEB ? undefined : IS_LINUX ? LINUX_TITLE_BAR_HEIGHT : 0,
					paddingTop: 'calc(0.625rem + var(--safe-area-top))',
					paddingBottom: '0.625rem',
					paddingLeft: 'calc(0.75rem + var(--safe-area-left))',
					paddingRight: 'calc(0.75rem + var(--safe-area-right))',
				}}
				{...rest}
			>
				<Button size="icon-sm" variant="ghost" onClick={toggleSidebar}>
					<LazyIcon name="Sidebar" weight={'fill'} />
				</Button>
				<div className="text-lg font-medium">{rest.children}</div>
			</header>
			{isMobile && !IS_WEB && (
				<div
					data-slot="header-slot"
					aria-hidden
					style={{
						height:
							'calc(0.625rem + 2rem + 0.625rem + var(--safe-area-top))',
					}}
				/>
			)}
		</>
	)
}

export default MobileSettingSidebar
