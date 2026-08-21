/**
 * Whether the one-time "enable autostart" step is due.
 *
 * `hydrated` is load-bearing: the persisted flag defaults to `false`, so every
 * launch looks like a first launch until the store rehydrates.
 */
export function shouldRunAutostartFirstRun(input: {
	hydrated: boolean
	initialized: boolean
}): boolean {
	return input.hydrated && !input.initialized
}
