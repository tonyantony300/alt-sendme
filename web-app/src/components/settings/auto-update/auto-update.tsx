import { useTranslation } from "../../../i18n";
import { useAppSettingStore } from "../../../store/app-setting";
import {
    FrameTitle,
    FrameDescription,
    Frame,
    FramePanel,
} from "../../ui/frame";
import { Switch } from "../../ui/switch";

export function AutoUpdate() {
    const { t } = useTranslation();
    const value = useAppSettingStore((r) => r.autoUpdate);
    const toggle = useAppSettingStore((r) => r.setAutoUpdate);

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
        </Frame>
    );
}
