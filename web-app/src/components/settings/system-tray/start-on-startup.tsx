import { useTranslation } from "../../../i18n";
import { useAppSettingStore } from "../../../store/app-setting";
import { FrameDescription, FrameTitle } from "../../ui/frame";
import { Switch } from "../../ui/switch";

export function StartOnStartup() {
    const { t } = useTranslation();
    const value = useAppSettingStore((r) => r.startOnBoot);
    const toggle = useAppSettingStore((r) => r.setStartOnBoot);

    return (
        <div className="flex items-center justify-between">
            <div className="flex-1">
                <FrameTitle>
                    {t("settings.general.systembar.runOnSystemStartup.label")}
                </FrameTitle>
                <FrameDescription>
                    {t(
                        "settings.general.systembar.runOnSystemStartup.description",
                    )}
                </FrameDescription>
            </div>
            <Switch checked={value} onCheckedChange={toggle} />
        </div>
    );
}
