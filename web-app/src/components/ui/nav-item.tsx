import { ReactNode, useCallback, useEffect, useState } from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../i18n";
import { INavItem, NestedItemProps } from "../../types/nav-item";

const getIsOpen = (
    to: string,
    items: NestedItemProps[] | undefined,
    pathname: string,
) => {
    return [to, ...(items?.map((i) => i.to) ?? [])].some((p) =>
        pathname.startsWith(p),
    );
};
const BASE_NAV_LINK_CLASSES =
    "text-ui-fg-subtle transition-fg hover:bg-ui-bg-subtle-hover flex items-center gap-x-2 rounded-md py-0.5 pl-0.5 pr-2 outline-none [&>svg]:text-ui-fg-subtle focus-visible:shadow-borders-focus";
const ACTIVE_NAV_LINK_CLASSES =
    "bg-ui-bg-base shadow-elevation-card-rest text-ui-fg-base hover:bg-ui-bg-base";
const NESTED_NAV_LINK_CLASSES = "pl-[34px] pr-2 py-1 w-full text-ui-fg-muted";
const SETTING_NAV_LINK_CLASSES = "pl-2 py-1";
export const NavItem = ({
    icon,
    label,
    to,
    items,
    type = "core",
    from,
    translationNs,
}: INavItem) => {
    const { t } = useTranslation(translationNs as any);
    const { pathname } = useLocation();
    const [open, setOpen] = useState(getIsOpen(to, items, pathname));

    // Use translation if translationNs is provided, otherwise use label as-is
    const displayLabel: string = translationNs ? t(label) : label;

    useEffect(() => {
        setOpen(getIsOpen(to, items, pathname));
    }, [pathname, to, items]);

    const navLinkClassNames = useCallback(
        ({
            to,
            isActive,
            isNested = false,
            isSetting = false,
        }: {
            to: string;
            isActive: boolean;
            isNested?: boolean;
            isSetting?: boolean;
        }) => {
            if (["core", "setting"].includes(type)) {
                isActive = pathname.startsWith(to);
            }

            return cn(BASE_NAV_LINK_CLASSES, {
                [NESTED_NAV_LINK_CLASSES]: isNested,
                [ACTIVE_NAV_LINK_CLASSES]: isActive,
                [SETTING_NAV_LINK_CLASSES]: isSetting,
            });
        },
        [type, pathname],
    );

    return (
        <div className="px-3">
            <NavLink
                to={to}
                end={items?.some((i) => i.to === pathname)}
                state={
                    from
                        ? {
                              from,
                          }
                        : undefined
                }
                className={({ isActive }) => {
                    return cn(navLinkClassNames({ isActive, to }), {
                        "max-lg:hidden": !!items?.length,
                    });
                }}
            >
                <p className="text-sm font-medium leading-tight">
                    {displayLabel}
                </p>
            </NavLink>
            {items && items.length > 0 && (
                <Collapsible.Root open={open} onOpenChange={setOpen}>
                    <Collapsible.Trigger
                        className={cn(
                            "text-ui-fg-subtle hover:text-ui-fg-base transition-fg hover:bg-ui-bg-subtle-hover flex w-full items-center gap-x-2 rounded-md py-0.5 pl-0.5 pr-2 outline-none lg:hidden",
                            { "pl-2": isSetting },
                        )}
                    >
                        <div className="flex size-6 items-center justify-center">
                            {icon}
                        </div>
                        <p className="text-sm font-medium leading-tight">
                            {displayLabel}
                        </p>
                    </Collapsible.Trigger>
                    <Collapsible.Panel>
                        <div className="flex flex-col gap-y-0.5 pb-2 pt-0.5">
                            <ul className="flex flex-col gap-y-0.5">
                                <li className="flex w-full items-center gap-x-1 lg:hidden">
                                    <NavLink
                                        to={to}
                                        end
                                        className={({ isActive }) => {
                                            return cn(
                                                navLinkClassNames({
                                                    to,
                                                    isActive,
                                                    isSetting,
                                                    isNested: true,
                                                }),
                                            );
                                        }}
                                    >
                                        <p className="text-sm font-medium leading-tight">
                                            {displayLabel}
                                        </p>
                                    </NavLink>
                                </li>
                                {items.map((item) => {
                                    const { t: itemT } = useTranslation(
                                        item.translationNs as any,
                                    );
                                    const itemLabel: string = item.translationNs
                                        ? itemT(item.label)
                                        : item.label;

                                    return (
                                        <li
                                            key={item.to}
                                            className="flex h-7 items-center"
                                        >
                                            <NavLink
                                                to={item.to}
                                                end
                                                className={({ isActive }) => {
                                                    return cn(
                                                        navLinkClassNames({
                                                            to: item.to,
                                                            isActive,
                                                            isSetting,
                                                            isNested: true,
                                                        }),
                                                    );
                                                }}
                                            >
                                                <p className="text-sm font-medium leading-tight">
                                                    {itemLabel}
                                                </p>
                                            </NavLink>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </Collapsible.Panel>
                </Collapsible.Root>
            )}
        </div>
    );
};
