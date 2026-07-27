import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/**
 * UUID v4 that works outside secure contexts.
 * `crypto.randomUUID` is missing on plain HTTP for non-localhost hosts
 * (e.g. http://app.example.internal on a LAN hostname).
 */
export function randomUUID(): string {
	const cryptoObj = globalThis.crypto
	if (typeof cryptoObj?.randomUUID === 'function') {
		return cryptoObj.randomUUID()
	}

	const bytes = new Uint8Array(16)
	if (typeof cryptoObj?.getRandomValues === 'function') {
		cryptoObj.getRandomValues(bytes)
	} else {
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = Math.floor(Math.random() * 256)
		}
	}
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Copy text to the clipboard outside secure contexts.
 * `navigator.clipboard` is missing on plain HTTP for non-localhost hosts.
 */
export async function copyTextToClipboard(text: string): Promise<void> {
	const clipboard = globalThis.navigator?.clipboard
	if (clipboard && typeof clipboard.writeText === 'function') {
		await clipboard.writeText(text)
		return
	}

	if (typeof document === 'undefined') {
		throw new Error('Clipboard API unavailable')
	}

	const textarea = document.createElement('textarea')
	textarea.value = text
	textarea.setAttribute('readonly', '')
	textarea.style.position = 'fixed'
	textarea.style.top = '0'
	textarea.style.left = '0'
	textarea.style.width = '1px'
	textarea.style.height = '1px'
	textarea.style.padding = '0'
	textarea.style.border = 'none'
	textarea.style.outline = 'none'
	textarea.style.boxShadow = 'none'
	textarea.style.background = 'transparent'
	textarea.style.opacity = '0'
	document.body.appendChild(textarea)
	textarea.focus()
	textarea.select()
	textarea.setSelectionRange(0, text.length)

	let copied = false
	try {
		copied = document.execCommand('copy')
	} finally {
		textarea.remove()
	}

	if (!copied) {
		throw new Error('Clipboard copy failed')
	}
}

interface FileSizeFormatOptions {
	zeroValue?: string
	precision?: number
	smallPrecision?: number
}

export function formatFileSize(
	bytes: number,
	{
		zeroValue = '0 B',
		precision = 0,
		smallPrecision = 1,
	}: FileSizeFormatOptions = {}
) {
	if (!Number.isFinite(bytes) || bytes <= 0) {
		return zeroValue
	}

	const units = ['B', 'KB', 'MB', 'GB', 'TB']
	const exponent = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1
	)
	const size = bytes / 1024 ** exponent
	const decimals = size < 10 && exponent > 0 ? smallPrecision : precision

	return `${size.toFixed(decimals)} ${units[exponent]}`
}
