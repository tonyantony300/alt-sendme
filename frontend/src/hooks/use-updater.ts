import {
	queryOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { toastManager } from '../components/ui/toast'
import { useTranslation } from '../i18n/react-i18next-compat'
import {
	IS_ANDROID_UPDATE_CHECK_ENABLED,
	IS_MOBILE,
	IS_WEB,
	IS_FLATPAK,
} from '../lib/platform'
import { invoke } from '../lib/platform-api'
import { openExternalUrl } from '../lib/openExternalUrl'
import { useUpdaterStore } from '../store/updater-store'
import { isWindowsPortableBuild } from './use-windows-portable'

type TauriUpdate = NonNullable<Awaited<ReturnType<typeof check>>>

/**
 * What a sideloaded Android check yields: there is nothing to install, only a
 * release page to open. Mirrors the `AndroidUpdate` the Rust command returns.
 */
type AndroidUpdate = {
	version: string
	notes: string
	url: string
}

/**
 * One shape for both paths. `handle` is the plugin's `Update`, present only
 * where the app can install the release itself; `url` is set instead where it
 * can only point at one.
 */
export type UpdateInfo = {
	version: string
	handle: TauriUpdate | null
	url: string | null
} | null

/**
 * GitHub is polled on a timer rather than on every window focus. A refocus
 * re-check produced a fresh `Update` object each time, which re-opened the
 * banner the user had just dismissed.
 */
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

async function checkForUpdate(): Promise<UpdateInfo> {
	// The updater plugin is registered `#[cfg(desktop)]`, so calling it on
	// mobile always rejects. Sideloaded Android asks GitHub directly instead.
	if (IS_MOBILE) {
		if (!IS_ANDROID_UPDATE_CHECK_ENABLED) return null
		const update = await invoke<AndroidUpdate | null>('check_android_update')
		return update
			? { version: update.version, handle: null, url: update.url }
			: null
	}
	// Flatpak builds omit the updater plugin.
	if (IS_WEB || IS_FLATPAK) {
		return null
	}
	// Portable ZIP users must download a new archive; applying the NSIS/MSI
	// updater would install over / beside the extracted folder incorrectly.
	if (await isWindowsPortableBuild()) {
		return null
	}
	const update = await check()
	return update ? { version: update.version, handle: update, url: null } : null
}

export const updaterQueryKeys = {
	all: ['updater'] as const,
	checkUpdate: () => ['updater', 'check'] as const,
}

export const updaterQueryOptions = {
	checkUpdate: () =>
		queryOptions({
			queryKey: updaterQueryKeys.checkUpdate(),
			queryFn: async () => checkForUpdate(),
			retry: 1,
			staleTime: CHECK_INTERVAL_MS,
			refetchInterval: CHECK_INTERVAL_MS,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			// The cached value is the `Update` handle the install path reuses, so
			// it must outlive the component that fetched it.
			gcTime: Number.POSITIVE_INFINITY,
		}),
}

const useCheckUpdateQuery = (
	options?: Omit<
		UseQueryOptions<
			UpdateInfo,
			Error,
			UpdateInfo,
			readonly ['updater', 'check']
		>,
		'queryKey' | 'queryFn'
	>
) => {
	// Deliberately quiet: this is the unattended 6-hourly poll, and a toast for
	// a transient network failure the user never asked about is pure noise. The
	// manual "Check for updates" button reports its own failures.
	// (The `meta.onError` this used to declare was dead code — react-query only
	// calls that through a `QueryCache` handler, which is not configured.)
	return useQuery({
		...updaterQueryOptions.checkUpdate(),
		...options,
	})
}

/**
 * Runs the periodic check and mirrors the outcome into the updater store.
 * Mounted once, by `AppUpdater` — every other surface reads the store.
 *
 * The effect keys off the version *string*, not the `Update` object, so a
 * re-check that finds the same release is a no-op rather than a re-prompt.
 */
export const useUpdaterSync = (enabled: boolean) => {
	const updateFound = useUpdaterStore((s) => s.updateFound)
	const noUpdate = useUpdaterStore((s) => s.noUpdate)
	const query = useCheckUpdateQuery({ enabled })
	const { isSuccess } = query
	const version = query.data?.version ?? null
	const url = query.data?.url ?? null

	useEffect(() => {
		if (!isSuccess) return
		if (version) updateFound(version, url)
		else noUpdate()
	}, [isSuccess, version, url, updateFound, noUpdate])

	return query
}

export const useCheckForUpdatesMutation = () => {
	const queryClient = useQueryClient()
	const { t } = useTranslation()
	const updateFound = useUpdaterStore((s) => s.updateFound)
	const noUpdate = useUpdaterStore((s) => s.noUpdate)

	return useMutation({
		mutationFn: async () => checkForUpdate(),
		onSuccess: (update) => {
			// Seed the cache so `install` reuses this handle instead of re-checking.
			queryClient.setQueryData(updaterQueryKeys.checkUpdate(), update)
			if (update) updateFound(update.version, update.url)
			else noUpdate()
		},
		onError: (error: Error) => {
			console.error('Failed to check for updates:', error)
			toastManager.add({
				title: t('updater.checkFailed'),
				description: t('updater.checkFailedDesc'),
				type: 'error',
			})
		},
	})
}

/**
 * The one install path. `install` downloads and stages the update, reporting
 * progress through the store; `restart` is separate so callers can warn about
 * an in-flight transfer before the window disappears.
 */
export const useInstallUpdate = () => {
	const queryClient = useQueryClient()
	const { t } = useTranslation()
	const startDownload = useUpdaterStore((s) => s.startDownload)
	const setContentLength = useUpdaterStore((s) => s.setContentLength)
	const addProgress = useUpdaterStore((s) => s.addProgress)
	const downloadFinished = useUpdaterStore((s) => s.downloadFinished)
	const installFinished = useUpdaterStore((s) => s.installFinished)
	const restarting = useUpdaterStore((s) => s.restarting)
	const fail = useUpdaterStore((s) => s.fail)
	const downloadUrl = useUpdaterStore((s) => s.downloadUrl)

	const install = useCallback(async () => {
		// Sideloaded Android can only point at the release; there is no download
		// to own, and the update stays "available" until the user installs it.
		if (downloadUrl) {
			await openExternalUrl(downloadUrl)
			return
		}
		// Whichever surface clicks first owns the download; the rest no-op.
		if (!startDownload()) return
		try {
			const cached = queryClient.getQueryData<UpdateInfo>(
				updaterQueryKeys.checkUpdate()
			)
			const update = cached ?? (await checkForUpdate())
			if (!update?.handle) {
				fail()
				return
			}
			await update.handle.downloadAndInstall((event) => {
				if (event.event === 'Started') {
					if (event.data.contentLength) {
						setContentLength(event.data.contentLength)
					}
				} else if (event.event === 'Progress') {
					addProgress(event.data.chunkLength)
				} else {
					downloadFinished()
				}
			})
			installFinished()
		} catch (error) {
			console.error('Failed to install update:', error)
			fail()
			toastManager.add({
				title: t('updater.installFailed'),
				description: t('updater.installFailedDesc'),
				type: 'error',
			})
		}
	}, [
		queryClient,
		t,
		downloadUrl,
		startDownload,
		setContentLength,
		addProgress,
		downloadFinished,
		installFinished,
		fail,
	])

	const restart = useCallback(async () => {
		restarting()
		try {
			await relaunch()
		} catch (error) {
			console.error('Failed to relaunch after update:', error)
			// Back to `ready` so the button is clickable again.
			installFinished()
			toastManager.add({
				title: t('updater.restartFailed'),
				description: t('updater.restartFailedDesc'),
				type: 'error',
			})
		}
	}, [restarting, installFinished, t])

	return { install, restart }
}
