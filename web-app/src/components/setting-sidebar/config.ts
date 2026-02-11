import { INavItem } from "../../types/nav-item";

export const settingSidebarConfig: Record<string, INavItem[]> = {
    core: [
        {
            label: "Language & Display",
            icon: "Palette",
            to: "", // as index
        },
        {
            label: "Network",
            icon: "Network",
            to: "network",
        },
        {
            label: "Notification",
            icon: "BellRinging",
            to: "notification",
        },
    ],
};
