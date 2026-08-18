/**
 * The persisted Android download-folder keys.
 *
 * Both are Android-only: `downloadsUri` is the SAF tree URI granted by the
 * folder picker, `downloadsPath` its human-readable form for display. Desktop
 * resolves its own folder from `downloadDir()` on every launch and never reads
 * either, so clearing them off-Android is a no-op.
 */
export type PersistedDownloadFolder = {
	downloadsUri?: string
	downloadsPath?: string
}

/**
 * Settings version that introduced the `Download/DashBeam` default.
 *
 * Anything persisted below this predates MediaStore exports, so its folder —
 * whether explicitly picked or left empty — is dropped once.
 */
export const MEDIA_STORE_DEFAULT_VERSION = 2

/**
 * Move a stored SAF folder aside so receives land in `Download/DashBeam`.
 *
 * Before MediaStore, a receive with no picked folder left its files in
 * app-private storage — invisible to every file manager and impossible to
 * open. Clearing the stored URI puts every install on the new default, which
 * is why this drops a folder the user picked deliberately rather than only
 * filling in an empty one.
 *
 * It runs at most once: `persist` writes the new version back during
 * rehydration, so a folder picked *after* upgrading is carried through
 * untouched.
 */
export function migrateDownloadFolder<
	T extends PersistedDownloadFolder & Record<string, unknown>,
>(
	state: T,
	version: number
): T & { downloadsUri: string; downloadsPath: string } {
	if (version < MEDIA_STORE_DEFAULT_VERSION) {
		return { ...state, downloadsUri: '', downloadsPath: '' }
	}

	return state as T & { downloadsUri: string; downloadsPath: string }
}
