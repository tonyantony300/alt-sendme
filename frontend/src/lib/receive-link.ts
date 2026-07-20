export const RECEIVE_LINK_BASE = 'https://app.altsendme.com/receive'

export function buildReceiveLink(
	ticket: string,
	baseUrl = RECEIVE_LINK_BASE
): string {
	const url = new URL('/receive', baseUrl)
	url.searchParams.set('ticket', ticket)
	return url.toString()
}

export function ticketFromReceiveLink(value: string): string | null {
	try {
		const url = new URL(value)
		if (url.pathname !== '/receive') return null

		const ticket = url.searchParams.get('ticket')?.trim()
		return ticket || null
	} catch {
		return null
	}
}
