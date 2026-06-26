import { createBrowserRouter, Navigate } from 'react-router-dom'
import { SettingsPage } from './settings'
import { IndexPage } from '.'
import { RootLayout } from '@/components/layouts/RootLayout'
import { NotFoundPage } from './notfound'
import { SettingGeneralPage } from './settings.general'
import { SettingNetworkPage } from './settings.network'
import { SettingLayout } from '../components/layouts/SettingLayout'

export interface RouteConfig {
	path: string
	element: JSX.Element
}

export const routers = createBrowserRouter([
	{
		path: '/',
		Component: RootLayout,
		children: [
			{
				index: true,
				Component: IndexPage,
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
				],
			},
		],
	},
	{
		path: '*',
		Component: NotFoundPage,
	},
])
