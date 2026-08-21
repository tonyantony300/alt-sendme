import { useEffect } from 'react'
import { IS_DESKTOP } from '@/lib/platform'
import { setAutostart } from '@/lib/autostart'
import { shouldRunAutostartFirstRun } from '@/lib/autostart-first-run'
import { useAppSettingStore } from '@/store/app-setting'

/**
 * Turns on start-at-login once, on the very first launch — paired devices only
 * see each other online while DashBeam runs. Registers a real login item, since
 * the Settings switch reads the OS rather than a cached flag.
 *
 * `autostartInitialized` records that the attempt happened, not that it
 * succeeded — neither a user who turned it back off nor a platform that
 * refused should be asked again.
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
