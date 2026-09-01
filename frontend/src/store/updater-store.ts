import { create } from 'zustand'

/**
 * Phases of a desktop update, in the order they occur. `installing` covers the
 * tail of `downloadAndInstall` after the bytes are in but before the installer
 * has finished; `ready` means the new version is staged and only a relaunch is
 * left.
 */
export type UpdaterPhase =
	| 'idle'
	| 'available'
	| 'downloading'
	| 'installing'
	| 'ready'
	| 'restarting'

export interface UpdaterStoreApi {
	phase: () => UpdaterPhase
	version: () => string | null
	/** Release page for builds that cannot install in place; null on desktop. */
	downloadUrl: () => string | null
	downloadedBytes: () => number
	contentLength: () => number | null
	dismissedVersion: () => string | null
	progressRatio: () => number | null
	bannerVisible: () => boolean
	updateFound: (version: string, downloadUrl?: string | null) => void
	noUpdate: () => void
	dismiss: () => void
	startDownload: () => boolean
	setContentLength: (bytes: number) => void
	addProgress: (bytes: number) => void
	downloadFinished: () => void
	installFinished: () => void
	restarting: () => void
	fail: () => void
}

/**
 * Plain factory holding the update lifecycle, free of zustand/React so it runs
 * under `node:test`. `useUpdaterStore` below wraps one instance for components.
 *
 * It is the single source of truth for all three update surfaces (the banner,
 * the settings sidebar alert and the settings panel), which is what keeps two
 * of them from starting two downloads of the same release.
 */
export function createUpdaterStore(
	options: { dismissedVersion?: string | null } = {}
): UpdaterStoreApi {
	let phase: UpdaterPhase = 'idle'
	let version: string | null = null
	let downloadUrl: string | null = null
	let downloadedBytes = 0
	let contentLength: number | null = null
	let dismissedVersion: string | null = options.dismissedVersion ?? null

	const clearProgress = () => {
		downloadedBytes = 0
		contentLength = null
	}

	const updateFound: UpdaterStoreApi['updateFound'] = (found, url = null) => {
		// A periodic re-check must not restart a download that's already running.
		if (phase !== 'idle' && phase !== 'available') return
		version = found
		downloadUrl = url
		phase = 'available'
	}

	const noUpdate: UpdaterStoreApi['noUpdate'] = () => {
		if (phase !== 'idle' && phase !== 'available') return
		version = null
		downloadUrl = null
		phase = 'idle'
		clearProgress()
	}

	const startDownload: UpdaterStoreApi['startDownload'] = () => {
		if (phase !== 'available') return false
		phase = 'downloading'
		clearProgress()
		return true
	}

	const fail: UpdaterStoreApi['fail'] = () => {
		phase = version ? 'available' : 'idle'
		clearProgress()
	}

	return {
		phase: () => phase,
		version: () => version,
		downloadUrl: () => downloadUrl,
		downloadedBytes: () => downloadedBytes,
		contentLength: () => contentLength,
		dismissedVersion: () => dismissedVersion,
		progressRatio: () =>
			contentLength ? Math.min(1, downloadedBytes / contentLength) : null,
		// "Later" only silences the banner for the version it was clicked on, and
		// only while that version is still merely available — once bytes are
		// moving the banner is progress, not a nag.
		bannerVisible: () =>
			phase !== 'idle' &&
			(phase !== 'available' || dismissedVersion !== version),
		updateFound,
		noUpdate,
		dismiss: () => {
			dismissedVersion = version
		},
		startDownload,
		setContentLength: (bytes) => {
			contentLength = bytes
		},
		addProgress: (bytes) => {
			downloadedBytes += bytes
		},
		downloadFinished: () => {
			phase = 'installing'
		},
		installFinished: () => {
			phase = 'ready'
		},
		restarting: () => {
			phase = 'restarting'
		},
		fail,
	}
}

const DISMISSED_KEY = 'dashbeam.updater.dismissed-version'

/** `localStorage` is absent under `node --test`, and can throw in a webview. */
function readDismissedVersion(): string | null {
	try {
		return typeof localStorage === 'undefined'
			? null
			: localStorage.getItem(DISMISSED_KEY)
	} catch {
		return null
	}
}

function writeDismissedVersion(value: string | null): void {
	try {
		if (typeof localStorage === 'undefined') return
		if (value === null) localStorage.removeItem(DISMISSED_KEY)
		else localStorage.setItem(DISMISSED_KEY, value)
	} catch {
		// A dismissal that doesn't survive a restart is not worth failing over.
	}
}

type UpdaterState = {
	phase: UpdaterPhase
	version: string | null
	downloadUrl: string | null
	downloadedBytes: number
	contentLength: number | null
	dismissedVersion: string | null
	progressRatio: number | null
	bannerVisible: boolean
	updateFound: (version: string, downloadUrl?: string | null) => void
	noUpdate: () => void
	dismiss: () => void
	startDownload: () => boolean
	setContentLength: (bytes: number) => void
	addProgress: (bytes: number) => void
	downloadFinished: () => void
	installFinished: () => void
	restarting: () => void
	fail: () => void
}

/** Every derived value comes from the core, so the tested logic has one home. */
function snapshot(core: UpdaterStoreApi) {
	return {
		phase: core.phase(),
		version: core.version(),
		downloadUrl: core.downloadUrl(),
		downloadedBytes: core.downloadedBytes(),
		contentLength: core.contentLength(),
		dismissedVersion: core.dismissedVersion(),
		progressRatio: core.progressRatio(),
		bannerVisible: core.bannerVisible(),
	}
}

export const useUpdaterStore = create<UpdaterState>((set) => {
	const core = createUpdaterStore({ dismissedVersion: readDismissedVersion() })
	const publish = () => set(snapshot(core))
	// The updater emits one Progress event per chunk — thousands for a typical
	// installer. Re-rendering on each would be its own kind of jerk, so the core
	// stays byte-exact while the UI only hears about visible movement.
	let publishedRatio: number | null = null

	return {
		...snapshot(core),
		updateFound: (version, downloadUrl) => {
			core.updateFound(version, downloadUrl)
			publish()
		},
		noUpdate: () => {
			core.noUpdate()
			publish()
		},
		dismiss: () => {
			core.dismiss()
			writeDismissedVersion(core.dismissedVersion())
			publish()
		},
		startDownload: () => {
			const started = core.startDownload()
			if (started) {
				publishedRatio = null
				publish()
			}
			return started
		},
		setContentLength: (bytes) => {
			core.setContentLength(bytes)
			publish()
		},
		addProgress: (bytes) => {
			core.addProgress(bytes)
			const ratio = core.progressRatio()
			// Without a content length nothing on screen moves, so a byte count
			// nobody renders isn't worth a render.
			if (ratio === null) return
			if (
				publishedRatio !== null &&
				ratio - publishedRatio < 0.005 &&
				ratio < 1
			) {
				return
			}
			publishedRatio = ratio
			publish()
		},
		downloadFinished: () => {
			core.downloadFinished()
			publish()
		},
		installFinished: () => {
			core.installFinished()
			publish()
		},
		restarting: () => {
			core.restarting()
			publish()
		},
		fail: () => {
			core.fail()
			publishedRatio = null
			publish()
		},
	}
})
