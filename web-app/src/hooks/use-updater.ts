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

type UpdateInfo = Awaited<ReturnType<typeof check>>

export const updaterQueryKeys = {
	all: ['updater'] as const,
	checkUpdate: () => ['updater', 'check'] as const,
}

export const updaterQueryOptions = {
	checkUpdate: () =>
		queryOptions({
			queryKey: updaterQueryKeys.checkUpdate(),
			queryFn: async () => {
				return check()
			},
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
		mutationFn: async () => {
			const update = await check()
			return update
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

export const useInstallUpdateMutation = () => {
	const queryClient = useQueryClient()
	const { t } = useTranslation()

	return useMutation({
		mutationFn: async () => {
			const update = await check()
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
