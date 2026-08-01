export function buildReceiveLink(
	ticket: string,
	baseUrl = 'https://app.dashbeam.net/receive'
): string {
	const url = new URL('/receive', baseUrl)
	url.searchParams.set('ticket', ticket)
	return url.toString()
}

/** Soft-brand intro above the URL so chat previews keep the receive-link thumbnail. */
export function formatReceiveShareMessage(intro: string, url: string): string {
	return `${intro}\n\n${url}`
}

function ticketFromReceiveUrl(value: string): string | null {
	try {
		const url = new URL(value)
		if (url.pathname !== '/receive') return null

		const ticket = url.searchParams.get('ticket')?.trim()
		return ticket || null
	} catch {
		return null
	}
}

export function ticketFromReceiveLink(value: string): string | null {
	const trimmed = value.trim()
	const direct = ticketFromReceiveUrl(trimmed)
	if (direct) return direct

	// Share clipboard may include a soft-brand line above the URL.
	const urls = trimmed.match(/https?:\/\/[^\s]+/g)
	if (!urls) return null

	for (const candidate of urls) {
		const ticket = ticketFromReceiveUrl(candidate)
		if (ticket) return ticket
	}

	return null
}
