import { Navigate, useSearchParams } from 'react-router-dom'

/**
 * Compatibility route for older /receive links.
 *
 * # Note
 * The receive page is now on the index.tsx (UI, handling deep-links, etc).
 * This route only serves as a compatibility layer to redirect old /receive links to the new location.
 */
export function ReceivePage() {
	const [searchParams] = useSearchParams()
	const initialTicket = searchParams.get('ticket')
	const targetParams = new URLSearchParams()
	targetParams.set('tab', 'receive')
	if (initialTicket) {
		targetParams.set('ticket', initialTicket)
	}

	return <Navigate replace to={`/?${targetParams.toString()}`} />
}

export default ReceivePage
