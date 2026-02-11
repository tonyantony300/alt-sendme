import { AutoUpdate } from "../components/settings/auto-update";
import { SystemTray } from "../components/settings/system-tray/system-tray";

export function SettingGeneralPage() {
    return (
        <>
            <SystemTray />
            <AutoUpdate />
        </>
    );
}
