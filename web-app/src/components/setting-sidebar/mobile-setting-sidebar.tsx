import type { FC } from 'react'
import type React from 'react'
import { cn } from '../../lib/utils'
import { useSidebar } from '../ui/sidebar'
import { Button } from '../ui/button'
import { LazyIcon } from '../icons'

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
					'gap-2 border-b fixed border-border inset-x-0 top-0 items-center bg-muted backdrop-blur-md z-10',
					className
				)}
				style={{
					paddingTop: 'calc(0.625rem + env(safe-area-inset-top))',
					paddingBottom: '0.625rem',
					paddingLeft: 'calc(0.75rem + env(safe-area-inset-left))',
					paddingRight: 'calc(0.75rem + env(safe-area-inset-right))',
				}}
				{...rest}
			>
				<Button size="icon-sm" variant="ghost" onClick={toggleSidebar}>
					<LazyIcon name="Sidebar" weight={'fill'} />
				</Button>
				<div className="text-lg font-medium">{rest.children}</div>
			</header>
			{isMobile && (
				<div
					data-slot="header-slot"
					style={{ height: 'calc(2rem + env(safe-area-inset-top))' }}
				>
					&nbsp;
				</div>
			)}
		</>
	)
}

export default MobileSettingSidebar
