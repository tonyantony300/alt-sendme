import { useState, useEffect } from "react";

export function useDarkMode() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check local storage or system preference on initial load
        return (
            localStorage.getItem("theme") === "dark" ||
            (localStorage.getItem("theme") === "auto" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches)
        );
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light"); // or 'auto'
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    return { isDarkMode, toggleDarkMode };
}
