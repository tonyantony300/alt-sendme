import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

/**
 * Deep Link payload from Rust backend
 */
interface DeepLinkPayload {
	action: string
	ticket: string | null
	extra?: Record<string, unknown>
}

/**
 * DeepLinkHandler Component
 * Listens for deep-link events from Rust backend and handles routing/state updates
 */
export function DeepLinkHandler() {
	const navigate = useNavigate()

	useEffect(() => {
		let unlistenDeepLink: UnlistenFn | null = null
		let unlistenDeepLinkError: UnlistenFn | null = null

		const handleDeepLink = (payload: DeepLinkPayload) => {
			const { action, ticket } = payload
			switch (action) {
				case 'receive':
					if (ticket) {
						navigate(`/?tab=receive&ticket=${encodeURIComponent(ticket)}`)
					} else {
						navigate('/?tab=receive')
					}
					break
				case 'send':
					navigate('/?tab=send')
					break
				default:
					console.warn(`[DeepLinkHandler] Unknown action: ${action}`)
			}
		}

		const setupListeners = async () => {
			try {
				// Listen for deep-link events from Rust
				unlistenDeepLink = await listen<DeepLinkPayload>(
					'deep-link',
					(event) => {
						const payload = event.payload
						console.log('[DeepLinkHandler] Received deep-link event:', payload)
						handleDeepLink(payload)
					}
				)

				// Listen for deep-link errors
				unlistenDeepLinkError = await listen<{
					error: string
					url: string
				}>('deep-link-error', (event) => {
					console.error(
						'[DeepLinkHandler] Deep link error:',
						event.payload.error
					)
				})

				console.log('[DeepLinkHandler] Listeners initialized successfully')
			} catch (error) {
				// Silently fail if Tauri is not available (e.g. browser environment)
				console.debug(
					'[DeepLinkHandler] Note: Tauri event listener not available',
					error
				)
			}
		}

		setupListeners()

		return () => {
			if (unlistenDeepLink) unlistenDeepLink()
			if (unlistenDeepLinkError) unlistenDeepLinkError()
		}
	}, [navigate])

	return null
}

export default DeepLinkHandler
