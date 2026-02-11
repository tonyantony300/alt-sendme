import { IconName } from "../components/icons";

export type NavItemType = "core" | "integration";

export type NestedItemProps = {
    label: string;
    to: string;
    translationNs?: string;
};

export type INavItem = {
    icon?: IconName;
    label: string;
    to: string;
    items?: NestedItemProps[];
    type?: NavItemType;
    from?: string;
    nested?: string;
    translationNs?: string;
};
