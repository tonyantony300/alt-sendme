import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
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
