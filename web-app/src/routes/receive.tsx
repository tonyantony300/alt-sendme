import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Receiver } from '@/components/receiver/Receiver'

/**
 * Receive Page
 * Handles deep-link routing and auto-fills ticket parameter
 * Can be accessed via:
 * - /receive (empty)
 * - /receive?ticket=abc123 (pre-filled from deep link)
 */
export function ReceivePage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const initialTicket = searchParams.get('ticket')
	useEffect(() => {
		// Extract ticket from URL query params (from deep-link route)
		const ticketParam = searchParams.get('ticket')
		if (ticketParam) {
			if (searchParams.has('ticket')) {
				const newParams = new URLSearchParams(searchParams)
				newParams.delete('ticket')
				setSearchParams(newParams, { replace: true })
			}
		}
	}, [searchParams, setSearchParams])

	return (
		<div className="w-full">
			<Receiver initialTicket={initialTicket || undefined} />
		</div>
	)
}

export default ReceivePage
