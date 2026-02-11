
import {
    SettingSidebarContent,
    SettingSidebarCore,
    SettingSidebarFooter,
    SettingSidebarHeader,
    SettingSidebarRoot,
    SettingSidebarTitle,
} from "./setting-sidebar";
import { SettingSidebarUpdateAlert } from "./setting-sidebar-update-alert";

export default function SettingSidebar() {
    return (
        <SettingSidebarRoot
            className="h-[calc(100svh-2.5rem)] mt-10"
            variant="floating"
        >
            <SettingSidebarHeader className="border-b">
                <SettingSidebarTitle prev="/" />
            </SettingSidebarHeader>
            <SettingSidebarContent>
                <SettingSidebarCore />
            </SettingSidebarContent>
            <SettingSidebarUpdateAlert />
            <SettingSidebarFooter />
        </SettingSidebarRoot>
    );
}
