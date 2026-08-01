import { invoke } from './platform-api'
import { IS_DESKTOP } from './platform'

/**
 * Whether the OS launches DashBeam at sign-in. The OS is the source of
 * truth, not the persisted setting — a login item removed through system
 * settings must be reflected in the UI.
 *
 * Resolves to `null` when the platform cannot be asked. That is Flatpak: the
 * XDG Background portal has no read-only query, and requesting one just to
 * paint a toggle would show the user a consent dialog every time they opened
 * Settings. Callers keep their cached value on `null`.
 */
export async function isAutostartEnabled(): Promise<boolean | null> {
	if (!IS_DESKTOP) return false
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
