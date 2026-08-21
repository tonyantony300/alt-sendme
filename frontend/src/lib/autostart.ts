import { invoke } from './platform-api'
import { IS_DESKTOP } from './platform'

/**
 * Whether the OS launches DashBeam at sign-in. The OS is the source of truth,
 * not the persisted setting.
 *
 * `null` when the platform can't be asked: Flatpak (the portal has no read-only
 * query, and asking would pop a consent dialog every Settings visit) and
 * web/mobile. Callers keep their cached value.
 */
export async function isAutostartEnabled(): Promise<boolean | null> {
	// `null`, not `false`: "cannot be asked" is not "off".
	if (!IS_DESKTOP) return null
	return invoke<boolean | null>('autostart_is_enabled')
}

/**
 * Request an autostart change. Resolves to the state the OS ended up in, which
 * can differ from `enabled` when the platform or the user refuses.
 */
export async function setAutostart(enabled: boolean): Promise<boolean> {
	if (!IS_DESKTOP) return false
	return invoke<boolean>('autostart_set', { enabled })
}
