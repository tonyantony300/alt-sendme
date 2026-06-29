const GOATCOUNTER_COUNT_ENDPOINT = 'https://alt-sendme.goatcounter.com/count'

export function buildGoatCounterEventUrl(path: string): string {
	const url = new URL(GOATCOUNTER_COUNT_ENDPOINT)
	url.searchParams.set('p', path)
	url.searchParams.set('t', 'AltSendme transfer complete')
	url.searchParams.set('e', '1')
	url.searchParams.set('rnd', Math.random().toString(36).slice(2))
	return url.toString()
}

export function sendGoatCounterEvent(path: string): void {
	const url = buildGoatCounterEventUrl(path)

	if (typeof navigator === 'undefined') {
		return
	}

	navigator.sendBeacon?.(url)
}
