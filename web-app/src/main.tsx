import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializePlatformStyles } from './lib/platformStyles'

// Initialize platform-specific styles before rendering
initializePlatformStyles()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
