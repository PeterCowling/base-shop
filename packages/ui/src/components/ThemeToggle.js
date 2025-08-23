"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DesktopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme, Theme } from "@acme/platform-core/contexts/ThemeContext";
const themes = ["base", "dark", "system"];
const labels = {
    base: "Light",
    dark: "Dark",
    system: "System",
    brandx: "BrandX", // unused but satisfy type
};
const icons = {
    base: SunIcon,
    dark: MoonIcon,
    system: DesktopIcon,
    brandx: SunIcon,
};
export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const current = theme;
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    const Icon = icons[current];
    const toggleTheme = () => {
        setTheme(next);
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleTheme();
        }
    };
    return (_jsxs("div", { children: [_jsx("button", { type: "button", onClick: toggleTheme, onKeyDown: handleKeyDown, "aria-label": `Switch to ${labels[next]} theme`, className: "p-2", children: _jsx(Icon, {}) }), _jsxs("span", { "aria-live": "polite", className: "sr-only", children: [labels[current], " theme selected"] })] }));
}
