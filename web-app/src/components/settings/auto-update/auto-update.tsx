import { useState } from "react";
import { useTranslation } from "../../../i18n";
import { useAppSettingStore } from "../../../store/app-setting";
import { Button } from "../../ui/button";
import {
    FrameTitle,
    FrameDescription,
    Frame,
    FramePanel,
    FrameFooter,
} from "../../ui/frame";
import { Switch } from "../../ui/switch";
import { AlertDialog, AlertDialogContent } from "../../ui/alert-dialog";
import { Gift, Loader2 } from "lucide-react";
import { useCheckForUpdatesMutation, useInstallUpdateMutation } from "../../../hooks/use-updater";
import { toastManager } from "../../ui/toast";

export function AutoUpdate() {
    const { t } = useTranslation();
    const value = useAppSettingStore((r) => r.autoUpdate);
    const toggle = useAppSettingStore((r) => r.setAutoUpdate);
    const [isOpen, setIsOpen] = useState(false);
    
    const checkForUpdates = useCheckForUpdatesMutation();
    const handleUpdate = useInstallUpdateMutation();
    
    const handleCheckForUpdates = () => {
        checkForUpdates.mutate(undefined, {
            onSuccess: (update) => {
                if (update) {
                    setIsOpen(true);
                } else {
                    toastManager.add({
                        title: t("updater.noUpdatesTitle"),
                        description: t("updater.noUpdatesDescription"),
                        type: "info",
                    });
                }
            },
        });
    };
    
    const handleInstallUpdate = () => {
        handleUpdate.mutate(undefined, {
            onSuccess: () => {
                setIsOpen(false);
            },
        });
    };

    return (
        <Frame>
            <FramePanel className="flex items-center justify-between">
                <div className="flex-1">
                    <FrameTitle>
                        {t("settings.general.autoCheckUpdates.label")}
                    </FrameTitle>
                    <FrameDescription>
                        {t("settings.general.autoCheckUpdates.description")}
                    </FrameDescription>
                </div>
                <Switch checked={value} onCheckedChange={toggle} />
            </FramePanel>
            {value === false && (
                <FrameFooter className="flex-row justify-end">
                    <Button
                        className="w-48"
                        variant="secondary"
                        onClick={handleCheckForUpdates}
                        disabled={checkForUpdates.isPending}
                    >
                        {checkForUpdates.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {t("updater.checkForUpdates")}
                    </Button>
                </FrameFooter>
            )}
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent
                    backdropClassName="!bg-transparent !backdrop-blur-none"
                    className="fixed bottom-1 left-2 translate-x-0 translate-y-0 w-md"
                >
                    <div className="flex px-5 py-4 items-center gap-2">
                        <Gift className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm flex items-center text-muted-foreground">
                            {t("updater.newVersionAvailableInline", {
                                version: checkForUpdates.data?.version ?? "",
                            })}
                        </p>
                        <div className="flex gap-2 ml-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                            >
                                {t("updater.later")}
                            </Button>
                            <Button
                                size="sm"
                                disabled={handleUpdate.isPending}
                                onClick={handleInstallUpdate}
                            >
                                {handleUpdate.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    t("updater.updateNow")
                                )}
                            </Button>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </Frame>
    );
}
