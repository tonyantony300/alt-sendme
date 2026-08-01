import { useEffect } from 'react'
import { IS_DESKTOP } from '@/lib/platform'
import { setAutostart } from '@/lib/autostart'
import { shouldRunAutostartFirstRun } from '@/lib/autostart-first-run'
import { useAppSettingStore } from '@/store/app-setting'

/**
 * Turns on start-at-login once, on the very first launch.
 *
 * Paired devices can only see each other as online while DashBeam is
 * running, so the app opts itself in rather than hiding the capability
 * behind a setting most people never open. It is a real login item, not a
 * cached flag — the switch in Settings reads the OS, so anything less would
 * paint "on" over a system that has nothing registered.
 *
 * Runs at most once per install. `autostartInitialized` records that the
 * attempt happened, not that it succeeded: a user who turns the toggle off
 * must never have it turned back on by a later launch, and a platform that
 * refused (or a Flatpak user who denied the portal) must not be re-asked on
 * every startup.
 */
export function useAutostartFirstRun(): void {
	useEffect(() => {
		if (!IS_DESKTOP) return

		let disposed = false

		const run = () => {
			const store = useAppSettingStore.getState()
			if (
				!shouldRunAutostartFirstRun({
					hydrated: true,
					initialized: store.autostartInitialized,
				})
			) {
				return
			}

			// Claim the one-shot before awaiting, so a re-render or a second
			// hydration callback cannot start a second attempt.
			store.setAutostartInitialized(true)

			void setAutostart(true)
				.then((actual) => {
					if (disposed) return
					// `actual` is what the OS ended up with — false if the
					// platform or the user refused. Cache the truth, not the wish.
					useAppSettingStore.getState().setStartOnBoot(actual)
				})
				.catch((error) => {
					// Deliberately not retried: the toggle in Settings is the
					// recovery path, and retrying on every launch would nag a
					// Flatpak user with a portal dialog forever.
					console.warn('First-run autostart enable failed:', error)
				})
		}

		// The persisted flag defaults to false, so acting before rehydration
		// would re-enable autostart on every launch for someone who turned it
		// off. Wait for disk either way.
		let unsub: (() => void) | undefined
		if (useAppSettingStore.persist.hasHydrated()) {
			run()
		} else {
			unsub = useAppSettingStore.persist.onFinishHydration(() => {
				if (!disposed) run()
			})
		}

		return () => {
			disposed = true
			unsub?.()
		}
	}, [])
}
