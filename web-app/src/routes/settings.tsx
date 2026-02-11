import SettingSidebar from "../components/setting-sidebar";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar";
import { ThemeSelectRadio } from "../components/settings/theme-select-radio/theme-select-radio";

export function SettingsPage() {
    return (
        <SidebarProvider>
            <SettingSidebar />
            <SidebarInset className="p-4 pt-2">
                <ThemeSelectRadio />
            </SidebarInset>
        </SidebarProvider>
    );
}
