import { ArrowLeft } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "../ui/sidebar";
import { settingSidebarConfig } from "./config";
import { Link, NavLink } from "react-router-dom";
import { LazyIcon } from "../icons";
import { useTranslation } from "../../i18n";
import { cn } from "../../lib/utils";
import { LICENSE_LINK, PRIVACY_LINK, VERSION_DISPLAY } from "../../lib/version";
import { Badge } from "../ui/badge";

function SettingSidebarRoot(props: React.ComponentProps<typeof Sidebar>) {
    return <Sidebar {...props} />;
}

function SettingSidebarHeader(
    props: React.ComponentProps<typeof SidebarHeader>,
) {
    return <SidebarHeader {...props} />;
}

function SettingSidebarTitle({
    className,
    prev,
    ...props
}: React.ComponentProps<"div"> & { prev: string }) {
    return (
        <Link to={prev}>
            <div
                {...props}
                className={cn(
                    "group/sheader flex items-center gap-4",
                    className,
                )}
            >
                <ArrowLeft size="18" className="" />
                <h3 className="text-lg font-medium">Settings</h3>
            </div>
        </Link>
    );
}

function SettingSidebarContent(
    props: React.ComponentProps<typeof SidebarContent>,
) {
    return <SidebarContent {...props} />;
}

function SettingSidebarCore() {
    const items = settingSidebarConfig.core;
    const { t } = useTranslation();
    return (
        <SidebarGroup>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.label}>
                        <SidebarMenuItem>
                            <NavLink
                                className="flex item-center gap-2 data-disabled:pointer-events-none"
                                to={item.to}
                                data-disabled={item.disable}
                                onClick={(e) => {
                                    if (item.disable) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                }}
                                end
                            >
                                {({ isActive }) => (
                                    <SidebarMenuButton
                                        isActive={isActive}
                                        disabled={item.disable}
                                    >
                                        {item.icon && (
                                            <LazyIcon
                                                weight={
                                                    isActive
                                                        ? "duotone"
                                                        : "regular"
                                                }
                                                name={item.icon}
                                            />
                                        )}
                                        <span>
                                            {item.translationNs
                                                ? t(item.translationNs)
                                                : item.label}
                                        </span>
                                        {item.comingSoon && (
                                            <Badge size="sm" variant="info">
                                                {t("comingSoon")}
                                            </Badge>
                                        )}
                                    </SidebarMenuButton>
                                )}
                            </NavLink>
                        </SidebarMenuItem>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

function SettingSidebarFooter({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SidebarFooter>) {
    const { t } = useTranslation();
    return (
        <SidebarFooter
            className={cn(
                "text-sm flex-row items-center text-muted-foreground justify-around",
                className,
            )}
            {...props}
        >
            {/*TODO: Add link*/}
            <span>{VERSION_DISPLAY}</span>
            <div className="size-1 rounded-full bg-muted-foreground" />
            <a
                className="hover:underline hover:text-foreground transition-color"
                href={PRIVACY_LINK}
                target="_blank"
                rel="noopener noreferrer"
            >
                {t("privacyPolicy")}
            </a>
            <div className="size-1 rounded-full bg-muted-foreground" />
            <a
                className="hover:underline hover:text-foreground transition-color"
                href={LICENSE_LINK}
                target="_blank"
                rel="noopener noreferrer"
            >
                {t("license")}
            </a>
        </SidebarFooter>
    );
}

export {
    SettingSidebarContent,
    SettingSidebarHeader,
    SettingSidebarRoot,
    SettingSidebarTitle,
    SettingSidebarCore,
    SettingSidebarFooter,
};
