import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from '@/components/layouts/RootLayout'
import { getRouterBasename } from '@/lib/router-basename'
import { SettingLayout } from '../components/layouts/SettingLayout'
import { IndexPage } from '.'
import { HistoryPage } from './history'
import { NotFoundPage } from './notfound'
import { SettingsPage } from './settings'
import { SettingDevicesPage } from './settings.devices'
import { SettingGeneralPage } from './settings.general'
import { SettingNetworkPage } from './settings.network'

export interface RouteConfig {
	path: string
	element: JSX.Element
}

export const routers = createBrowserRouter(
	[
		{
			path: '/',
			Component: RootLayout,
			children: [
				{
					index: true,
					Component: IndexPage,
				},
				{
					path: '/receive',
					Component: IndexPage,
				},
				{
					path: '/history',
					Component: HistoryPage,
				},
				{
					path: '/settings',
					Component: SettingLayout,
					children: [
						{
							index: true,
							Component: SettingGeneralPage,
						},
						{
							path: 'appearance',
							Component: SettingsPage,
						},
						{
							path: 'general',
							element: <Navigate to="/settings" replace />,
						},
						{
							path: 'network',
							Component: SettingNetworkPage,
						},
						{
							path: 'devices',
							Component: SettingDevicesPage,
						},
					],
				},
			],
		},
		{
			path: '*',
			Component: NotFoundPage,
		},
	],
	{ basename: getRouterBasename() }
)
