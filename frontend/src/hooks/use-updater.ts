import {
	queryOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { toastManager } from '../components/ui/toast'
import { useTranslation } from '../i18n/react-i18next-compat'
import { IS_WEB, IS_FLATPAK } from '../lib/platform'
import { isWindowsPortableBuild } from './use-windows-portable'

type UpdateInfo = Awaited<ReturnType<typeof check>>

async function checkForDesktopUpdate(): Promise<UpdateInfo> {
	// Flatpak ships immutable app files and updates via `flatpak update`, so the
	// updater plugin is never registered there and check() would throw.
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
		}),
}

export const useCheckUpdateQuery = (
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

export const useCheckForUpdatesMutation = () => {
	const { t } = useTranslation()

	return useMutation({
		mutationFn: async () => checkForDesktopUpdate(),
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

export const useInstallUpdateMutation = () => {
	const queryClient = useQueryClient()
	const { t } = useTranslation()

	return useMutation({
		mutationFn: async () => {
			const update = await checkForDesktopUpdate()
			if (update) {
				await update.downloadAndInstall()
				await relaunch()
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: updaterQueryKeys.checkUpdate(),
			})
		},
		onError: (error: Error) => {
			console.error('Failed to install update:', error)
			toastManager.add({
				title: t('updater.installFailed'),
				description: t('updater.installFailedDesc'),
				type: 'error',
			})
		},
	})
}
