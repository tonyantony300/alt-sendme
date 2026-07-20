export const RECEIVE_LINK_BASE = 'https://app.altsendme.com/receive'

export function buildReceiveLink(ticket: string): string {
	const url = new URL(RECEIVE_LINK_BASE)
	url.searchParams.set('ticket', ticket)
	return url.toString()
}

export function ticketFromReceiveLink(value: string): string | null {
	try {
		const ticket = new URL(value).searchParams.get('ticket')?.trim()
		return ticket || null
	} catch {
		return null
	}
}
