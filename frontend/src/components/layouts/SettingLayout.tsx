import { motion } from 'motion/react'
import { Outlet, useLocation } from 'react-router-dom'
import { IS_WEB } from '@/lib/platform'
import { RelayChangeGuard } from '../settings/relay'
import SettingSidebar from '../setting-sidebar'
import { SidebarProvider, SidebarInset } from '../ui/sidebar'

export function SettingLayout() {
	const location = useLocation()

	return (
		<SidebarProvider className={IS_WEB ? 'h-full min-h-0' : undefined}>
			<SettingSidebar />
			<SidebarInset className="px-4 pb-12 pt-4 overflow-y-auto">
				<motion.div
					key={location.pathname}
					className="flex flex-col gap-4 outline-none"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3, ease: 'easeOut' }}
				>
					<Outlet />
				</motion.div>
			</SidebarInset>
			<RelayChangeGuard />
		</SidebarProvider>
	)
}
