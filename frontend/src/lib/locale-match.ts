// Maps tags whose base subtag differs from the bundled locale's.
const ALIASES: Record<string, string> = {
	nb: 'no',
	nn: 'no',
	'zh-hk': 'zh-TW',
	'zh-mo': 'zh-TW',
	'zh-hant': 'zh-TW',
}

/**
 * Matches a BCP 47 tag (e.g. `navigator.language`) against the bundled locale
 * keys: exact tag, then alias, then same base language subtag. Returns
 * undefined when nothing fits.
 */
export function matchLocale(
	tag: string | undefined,
	available: string[]
): string | undefined {
	if (!tag) return undefined
	const lower = tag.toLowerCase()
	const exact = available.find((k) => k.toLowerCase() === lower)
	if (exact) return exact

	const parts = lower.split('-')
	for (let i = parts.length; i > 0; i--) {
		const alias = ALIASES[parts.slice(0, i).join('-')]
		if (alias && available.includes(alias)) return alias
	}

	const base = parts[0]
	return available.find((k) => k.toLowerCase().split('-')[0] === base)
}
