import { createBrowserRouter } from 'react-router-dom'
import { SettingsPage } from './settings'
import { IndexPage } from '.'
import { RootLayout } from '@/components/layouts/RootLayout'
import { NotFoundPage } from './notfound'
import { SettingGeneralPage } from './settings.general'
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
						Component: SettingsPage,
						index: true,
					},
					{
						path: 'general',
						Component: SettingGeneralPage,
					},
					{
						path: 'network',
						Component: SettingsPage,
					},
					{
						path: 'notification',
						Component: SettingsPage,
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
