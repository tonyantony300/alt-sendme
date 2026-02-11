import { VERSION_DISPLAY } from "../../lib/version";
import { SidebarSeparator } from "../ui/sidebar";
import {
    SettingSidebarContent,
    SettingSidebarCore,
    SettingSidebarFooter,
    SettingSidebarHeader,
    SettingSidebarRoot,
    SettingSidebarTitle,
} from "./setting-sidebar";

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
            <SettingSidebarFooter />
        </SettingSidebarRoot>
    );
}
