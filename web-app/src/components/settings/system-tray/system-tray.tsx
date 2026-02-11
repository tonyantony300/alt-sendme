import { useTranslation } from "../../../i18n";
import {
    Frame,
    FrameDescription,
    FrameHeader,
    FramePanel,
    FrameTitle,
} from "../../ui/frame";
import { MinimizeSystemTray } from "./minimize-system-tray";
import { ShowProgressOnIcon } from "./show-progress-on-icon";
import { StartOnStartup } from "./start-on-startup";

export function SystemTray() {
    const { t } = useTranslation();
    return (
        <Frame>
            <FrameHeader>
                <FrameTitle>{t("settings.general.systembar.title")}</FrameTitle>
            </FrameHeader>
            <FramePanel className="space-y-4">
                <MinimizeSystemTray />
                <ShowProgressOnIcon />
                <StartOnStartup />
            </FramePanel>
        </Frame>
    );
}
