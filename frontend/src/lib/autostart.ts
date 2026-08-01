import { invoke } from './platform-api'
import { IS_DESKTOP } from './platform'

/**
 * Whether the OS launches DashBeam at sign-in. The OS is the source of
 * truth, not the persisted setting — a login item removed through system
 * settings must be reflected in the UI.
 *
 * Resolves to `null` when the platform cannot be asked. That is Flatpak — the
 * XDG Background portal has no read-only query, and requesting one just to
 * paint a toggle would show the user a consent dialog every time they opened
 * Settings — and also web/mobile, which have no login-item concept at all.
 * Callers keep their cached value on `null`.
 */
export async function isAutostartEnabled(): Promise<boolean | null> {
	// `null`, not `false`: "cannot be asked" is not the same as "off", and
	// reporting `off` here would let callers act on an answer nobody gave.
	if (!IS_DESKTOP) return null
	return invoke<boolean | null>('autostart_is_enabled')
}

/**
 * Request an autostart change. Resolves to the state the OS ended up in,
 * which can differ from `enabled` when the platform or the user (via the
 * Flatpak portal dialog) refuses.
 */
export async function setAutostart(enabled: boolean): Promise<boolean> {
	if (!IS_DESKTOP) return false
	return invoke<boolean>('autostart_set', { enabled })
}
