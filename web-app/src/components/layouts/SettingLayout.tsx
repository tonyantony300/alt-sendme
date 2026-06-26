import { Outlet } from 'react-router-dom'
import { RelayChangeGuard } from '../settings/relay'
import SettingSidebar from '../setting-sidebar'
import { SidebarProvider, SidebarInset } from '../ui/sidebar'

export function SettingLayout() {
	return (
		<SidebarProvider>
			<SettingSidebar />
			<SidebarInset className="px-4 pb-12 pt-2 gap-8 overflow-y-auto">
				<Outlet />
			</SidebarInset>
			<RelayChangeGuard />
		</SidebarProvider>
	)
}
