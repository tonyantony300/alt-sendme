import { useId, useMemo } from "react";
import { useThemeStore } from "../store";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { toastManager } from "./ui/toast";
import { Switch } from "./ui/switch";
import { MoonIcon, SunIcon } from "lucide-react";
import { Toggle } from "./ui/toggle";

export function ThemeSwitcher() {
    const { setTheme, activeTheme } = useThemeStore();
    const checked = activeTheme === "dark";
    const setChecked = (checked: boolean) => {
        const newTheme = checked ? "dark" : "light";
        setTheme(newTheme);
    };
    return (
        <div>
            <Toggle
                aria-label={`Switch to ${activeTheme === "dark" ? "light" : "dark"} mode`}
                className="group data-[state=on]:bg-transparent data-[state=on]:hover:bg-muted"
                onPressedChange={() => setChecked(!checked)}
                data-state={activeTheme === "dark" ? "on" : "off"}
                pressed={activeTheme === "dark"}
                size="sm"
            >
                <MoonIcon
                    aria-hidden="true"
                    className="shrink-0 scale-0 opacity-0 transition-all group-data-[state=on]:scale-100 group-data-[state=on]:opacity-100"
                    size={16}
                />
                <SunIcon
                    aria-hidden="true"
                    className="absolute shrink-0 scale-100 opacity-100 transition-all group-data-[state=on]:scale-0 group-data-[state=on]:opacity-0"
                    size={16}
                />
            </Toggle>
        </div>
    );
}
