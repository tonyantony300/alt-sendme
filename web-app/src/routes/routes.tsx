import { createBrowserRouter } from 'react-router-dom'
import { SettingsPage } from './settings'
import { IndexPage } from '.'
import { RootLayout } from '@/components/layouts/RootLayout'

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
				Component: SettingsPage,
			},
		],
	},
])
