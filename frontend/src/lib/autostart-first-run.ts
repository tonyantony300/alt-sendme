/**
 * Whether the one-time "enable autostart" step should run.
 *
 * DashBeam only shows paired devices as online while it is running, so it
 * enables itself at login once, on first launch, rather than waiting for the
 * user to find the setting. This decides whether that one-time step is due.
 *
 * `hydrated` is the load-bearing input. The persisted flag defaults to
 * `false`, so before the store has rehydrated from disk every launch looks
 * like a first launch — acting then would re-enable autostart on every
 * startup for a user who had deliberately turned it off.
 */
export function shouldRunAutostartFirstRun(input: {
	hydrated: boolean
	initialized: boolean
}): boolean {
	return input.hydrated && !input.initialized
}
