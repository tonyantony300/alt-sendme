/**
 * Utility functions for calculating and formatting ETA (Estimated Time of Arrival)
 * for file transfers.
 */

/**
 * Calculate ETA in seconds based on remaining bytes and current speed
 * @param bytesRemaining - Number of bytes left to transfer
 * @param speedBps - Current transfer speed in bytes per second
 * @returns ETA in seconds, or null if calculation is not possible
 */
export function calculateETA(
    bytesRemaining: number,
    speedBps: number
): number | null {
    // Avoid division by zero and handle invalid inputs
    if (speedBps <= 0 || bytesRemaining <= 0) {
        return null
    }

    return bytesRemaining / speedBps
}

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

/**
 * Class to maintain a moving average of transfer speeds for smoother ETA calculations
 */
export class SpeedAverager {
    private speeds: number[] = []
    private readonly maxSamples: number

    /**
     * @param maxSamples - Maximum number of speed samples to keep (default: 10)
     */
    constructor(maxSamples = 10) {
        this.maxSamples = maxSamples
    }

    /**
     * Add a new speed sample
     * @param speedBps - Speed in bytes per second
     */
    addSample(speedBps: number): void {
        this.speeds.push(speedBps)

        // Keep only the most recent samples
        if (this.speeds.length > this.maxSamples) {
            this.speeds.shift()
        }
    }

    /**
     * Get the average speed from all samples
     * @returns Average speed in bytes per second
     */
    getAverage(): number {
        if (this.speeds.length === 0) {
            return 0
        }

        const sum = this.speeds.reduce((acc, speed) => acc + speed, 0)
        return sum / this.speeds.length
    }

    /**
     * Reset all samples
     */
    reset(): void {
        this.speeds = []
    }

    /**
     * Get the number of samples currently stored
     */
    getSampleCount(): number {
        return this.speeds.length
    }
}
