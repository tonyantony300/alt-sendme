/**
 * Utility functions for calculating and formatting ETA (Estimated Time of Arrival)
 * for file transfers.
 */

/**
 * Format ETA seconds into a human-readable string
 * @param seconds - ETA in seconds
 * @returns Formatted string like "2 min 30 sec" or "45 sec"
 */
export function formatETA(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) {
		return '--'
	}

	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = Math.floor(seconds % 60)

	if (minutes > 0) {
		return `${minutes} min ${remainingSeconds} sec`
	}

	return `${remainingSeconds} sec`
}
