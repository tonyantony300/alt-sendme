import { motion } from 'motion/react'
import { Outlet, useLocation } from 'react-router-dom'
import { IS_WEB } from '@/lib/platform'
import { RelayChangeGuard } from '../settings/relay'
import SettingSidebar from '../setting-sidebar'
import { ScrollArea } from '../ui/scroll-area'
import { SidebarProvider, SidebarInset } from '../ui/sidebar'

export function SettingLayout() {
	const location = useLocation()

	return (
		<SidebarProvider className={IS_WEB ? 'h-full min-h-0' : undefined}>
			<SettingSidebar />
			<SidebarInset className="min-h-0">
				{/* Pin the scrollbar visible (opacity-0 until hover by default) so the
				    overflow is always obvious. */}
				<ScrollArea className="[&_[data-slot=scroll-area-scrollbar][data-orientation=vertical]]:opacity-100">
					<motion.div
						key={location.pathname}
						className="flex flex-col gap-4 px-4 pb-12 pt-4 outline-none"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3, ease: 'easeOut' }}
					>
						<Outlet />
					</motion.div>
				</ScrollArea>
			</SidebarInset>
			<RelayChangeGuard />
		</SidebarProvider>
	)
}
