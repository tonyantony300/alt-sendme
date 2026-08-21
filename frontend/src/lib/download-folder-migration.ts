/**
 * The persisted Android download-folder keys: `downloadsUri` is the SAF tree
 * URI from the picker, `downloadsPath` its display form. Desktop resolves its
 * own folder every launch, so clearing them off-Android is a no-op.
 */
export type PersistedDownloadFolder = {
	downloadsUri?: string
	downloadsPath?: string
}

/**
 * Settings version that introduced the `Download/DashBeam` default. Anything
 * below it predates MediaStore exports, so its folder is dropped once.
 */
export const MEDIA_STORE_DEFAULT_VERSION = 2

/**
 * Move a stored SAF folder aside so receives land in `Download/DashBeam`.
 * Before MediaStore, a receive with no picked folder left its files in
 * app-private storage, unopenable — so this drops even a deliberately picked
 * folder to put every install on the new default.
 *
 * Runs at most once: `persist` writes the new version back during rehydration,
 * so a folder picked after upgrading is kept.
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
