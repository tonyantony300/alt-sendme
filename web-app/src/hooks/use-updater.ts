import { queryOptions, useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

type UpdateInfo = Awaited<ReturnType<typeof check>>;

export const updaterQueryKeys = {
	all: ["updater"] as const,
	checkUpdate: () => ["updater", "check"] as const,
};

export const updaterQueryOptions = {
	checkUpdate: () =>
		queryOptions({
			queryKey: updaterQueryKeys.checkUpdate(),
			queryFn: async () => {
				return check();
			},
		}),
};

export const useCheckUpdateQuery = (
	options?: Omit<UseQueryOptions<UpdateInfo, Error, UpdateInfo, readonly ["updater", "check"]>, "queryKey" | "queryFn">
) => {
	return useQuery({
		...updaterQueryOptions.checkUpdate(),
		...options,
	});
};

export const useCheckForUpdatesMutation = () => {
	return useMutation({
		mutationFn: async () => {
			const update = await check();
			return update;
		},
	});
};

export const useInstallUpdateMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const update = await check();
			if (update) {
				await update.downloadAndInstall();
				await relaunch();
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: updaterQueryKeys.checkUpdate(),
			});
		},
	});
};
