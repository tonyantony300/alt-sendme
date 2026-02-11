import type { IconProps } from "@phosphor-icons/react";
import * as P from "@phosphor-icons/react";
// There is no way to get icon name of @phosphor icons
export type IconName =
    | "ArrowLeft"
    | "ArrowRight"
    | "Palette"
    | "BellRinging"
    | "Network"
    | "House"
    | "CheckCircle"
    | "XCircle"
    | "User"
    | "Users"
    | "MagnifyingGlass"
    | "GearSix"
    | "CaretDown"
    | "CaretUp"
    | "CaretLeft"
    | "Hexagon"
    | "FunnelSimpleX"
    | "Info"
    | "CaretRight";

export function LazyIcon(props: IconProps & { name: IconName }) {
    const Icon = P[props.name];

    if (Icon) return <Icon weight="regular" size="14" {...props} />;
    return null;
}
