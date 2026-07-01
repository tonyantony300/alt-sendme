import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import './i18n'
import { initializePlatformStyles } from './lib/platformStyles'
import { routers } from './routes/routes.tsx'
import { AppProviders } from './components/layouts/AppProviders'

initializePlatformStyles()

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<AppProviders>
			<RouterProvider router={routers} />
		</AppProviders>
	</React.StrictMode>
)
