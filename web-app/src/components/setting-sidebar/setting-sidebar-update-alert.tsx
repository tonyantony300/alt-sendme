import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { check } from "@tauri-apps/plugin-updater";
import { useAppSettingStore } from "../../store/app-setting";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { LazyIcon } from "../icons";
import { Button } from "../ui/button";
import { relaunch } from "@tauri-apps/plugin-process";
import { Loader2 } from "lucide-react";

export function SettingSidebarUpdateAlert() {
    const autoUpdate = useAppSettingStore((r) => r.autoUpdate);

    const queryClient = useQueryClient();
    const updateVersion = useQuery({
        queryKey: ["setting-sidebar-update-alert"],
        queryFn: async () => {
            return check();
        },
        enabled: autoUpdate,
    });
    const handleUpdate = useMutation({
        mutationFn: async () => {
            const update = await check();
            if (update) {
                await update.downloadAndInstall();
                await relaunch();
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["setting-sidebar-update-alert"],
            });
        },
    });

    if (updateVersion.isLoading || !updateVersion.data) {
        return null;
    }

    return (
        <div className="px-2 mb-4">
            <Alert variant="success">
                <LazyIcon name="Info" />
                <AlertTitle>New update!</AlertTitle>
                <AlertDescription>
                    New version {updateVersion.data?.version} is available.
                </AlertDescription>
                <div className="col-span-full pt-2 flex-1 flex justify-end">
                    <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleUpdate.mutate()}
                        disabled={handleUpdate.isPending}
                    >
                        {handleUpdate.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            "Update now"
                        )}
                    </Button>
                </div>
            </Alert>
        </div>
    );
}
