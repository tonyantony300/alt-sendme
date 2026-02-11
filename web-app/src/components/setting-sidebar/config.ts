import type { INavItem } from "../../types/nav-item";

export const settingSidebarConfig: Record<string, INavItem[]> = {
    core: [
        {
            label: "Language & Display",
            icon: "Palette",
            to: "", // as index
            translationNs: "settings.navItems.appearance",
        },
        {
            label: "General",
            icon: "GearSix",
            to: "general",
            translationNs: "settings.navItems.general",
        },
        {
            label: "Network",
            icon: "Network",
            to: "network",
            translationNs: "settings.navItems.network",
            disable: true,
            comingSoon: true,
        },
        {
            label: "Notification",
            icon: "BellRinging",
            to: "notification",
            translationNs: "settings.navItems.notification",
            disable: true,
            comingSoon: true,
        },
    ],
};
