import { useEffect } from "react";
import { useThemeStore } from "../store";
import { toastManager } from "./ui/toast";
type Props = {
    children: React.ReactNode;
};
export function AppThemeProvider({ children }: Props) {
    const isDark = useThemeStore((state) => state.isDark);
    const theme = useThemeStore((state) => state.activeTheme);

    useEffect(() => {
        if (theme == "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
        } else {
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");
        }
    }, [isDark, theme]);

    return <>{children}</>;
}
