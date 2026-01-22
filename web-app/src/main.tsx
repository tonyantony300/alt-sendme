import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import './i18n'
import { initializePlatformStyles } from './lib/platformStyles'
import { routers } from './routes/routes.tsx'

initializePlatformStyles()

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<RouterProvider router={routers} />,
	</React.StrictMode>
)
