import { useEffect, useState } from 'react'
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
	const [searchParams] = useSearchParams()
	const [ticket, setTicket] = useState<string | null>(null)

	useEffect(() => {
		// Extract ticket from URL query params (from deep-link route)
		const ticketParam = searchParams.get('ticket')
		if (ticketParam) {
			console.debug('[ReceivePage] Auto-filling ticket from URL:', ticketParam)
			setTicket(ticketParam)
		}
	}, [searchParams])

	return (
		<div className="w-full">
			<Receiver initialTicket={ticket} />
		</div>
	)
}

export default ReceivePage
