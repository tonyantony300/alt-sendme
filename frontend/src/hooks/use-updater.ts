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
import { IS_WEB, IS_FLATPAK } from '../lib/platform'
import { useUpdaterStore } from '../store/updater-store'
import { isWindowsPortableBuild } from './use-windows-portable'

type UpdateInfo = Awaited<ReturnType<typeof check>>

/**
 * GitHub is polled on a timer rather than on every window focus. A refocus
 * re-check produced a fresh `Update` object each time, which re-opened the
 * banner the user had just dismissed.
 */
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

async function checkForDesktopUpdate(): Promise<UpdateInfo> {
	// Flatpak builds omit the updater plugin.
	if (IS_WEB || IS_FLATPAK) {
		return null
	}
	// Portable ZIP users must download a new archive; applying the NSIS/MSI
	// updater would install over / beside the extracted folder incorrectly.
	if (await isWindowsPortableBuild()) {
		return null
	}
	return check()
}

export const updaterQueryKeys = {
	all: ['updater'] as const,
	checkUpdate: () => ['updater', 'check'] as const,
}

export const updaterQueryOptions = {
	checkUpdate: () =>
		queryOptions({
			queryKey: updaterQueryKeys.checkUpdate(),
			queryFn: async () => checkForDesktopUpdate(),
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
	const { t } = useTranslation()

	return useQuery({
		...updaterQueryOptions.checkUpdate(),
		...options,
		meta: {
			...(options?.meta || {}),
			onError: (error: Error) => {
				console.error('Failed to check for updates:', error)
				toastManager.add({
					title: t('updater.checkFailed'),
					description: t('updater.checkFailedDesc'),
					type: 'error',
				})
			},
		},
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

	useEffect(() => {
		if (!isSuccess) return
		if (version) updateFound(version)
		else noUpdate()
	}, [isSuccess, version, updateFound, noUpdate])

	return query
}

export const useCheckForUpdatesMutation = () => {
	const queryClient = useQueryClient()
	const { t } = useTranslation()
	const updateFound = useUpdaterStore((s) => s.updateFound)
	const noUpdate = useUpdaterStore((s) => s.noUpdate)

	return useMutation({
		mutationFn: async () => checkForDesktopUpdate(),
		onSuccess: (update) => {
			// Seed the cache so `install` reuses this handle instead of re-checking.
			queryClient.setQueryData(updaterQueryKeys.checkUpdate(), update)
			if (update) updateFound(update.version)
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

	const install = useCallback(async () => {
		// Whichever surface clicks first owns the download; the rest no-op.
		if (!startDownload()) return
		try {
			const cached = queryClient.getQueryData<UpdateInfo>(
				updaterQueryKeys.checkUpdate()
			)
			const update = cached ?? (await checkForDesktopUpdate())
			if (!update) {
				fail()
				return
			}
			await update.downloadAndInstall((event) => {
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
