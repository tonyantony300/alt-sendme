import SettingSidebar from "../components/setting-sidebar";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar";
import { ThemeSelectRadio } from "../components/settings/theme-select-radio/theme-select-radio";
import { LanguageSelect } from "../components/settings/language-select/language-select";

export function SettingsPage() {
    return (
        <SidebarProvider>
            <SettingSidebar />
            <SidebarInset className="p-4 pt-2 gap-8">
                <ThemeSelectRadio />
                <LanguageSelect />
            </SidebarInset>
        </SidebarProvider>
    );
}
