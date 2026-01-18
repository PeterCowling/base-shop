"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedTheme = getSavedTheme;
exports.getSystemTheme = getSystemTheme;
exports.ThemeProvider = ThemeProvider;
exports.useTheme = useTheme;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeContext = (0, react_1.createContext)(undefined);
function getSavedTheme() {
    if (typeof window === "undefined")
        return null;
    try {
        return window.localStorage.getItem("theme");
    }
    catch {
        return null;
    }
}
function getSystemTheme() {
    try {
        return window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches // i18n-exempt -- media query string, not user-facing copy
            ? "dark"
            : "base";
    }
    catch {
        return "base";
    }
}
function getInitialTheme() {
    const stored = getSavedTheme();
    if (stored)
        return stored;
    return "system";
}
function ThemeProvider({ children }) {
    const [theme, setTheme] = (0, react_1.useState)(getInitialTheme);
    const [systemTheme, setSystemTheme] = (0, react_1.useState)(getSystemTheme());
    (0, react_1.useLayoutEffect)(() => {
        const root = document.documentElement;
        root.classList.remove("theme-dark", "theme-brandx");
        const applied = theme === "system" ? systemTheme : theme;
        root.style.colorScheme = applied === "dark" ? "dark" : "light";
        if (applied === "dark")
            root.classList.add("theme-dark");
        if (applied === "brandx")
            root.classList.add("theme-brandx");
        try {
            window.localStorage.setItem("theme", theme);
        }
        catch {
            /* no-op */
        }
    }, [theme, systemTheme]);
    (0, react_1.useEffect)(() => {
        if (theme !== "system")
            return;
        let mq = null;
        const update = (e) => setSystemTheme(e.matches ? "dark" : "base");
        try {
            mq = window.matchMedia("(prefers-color-scheme: dark)"); // i18n-exempt -- media query string, not user-facing copy
            update(mq);
            mq.addEventListener("change", update);
            return () => mq?.removeEventListener("change", update);
        }
        catch {
            setSystemTheme("base");
        }
    }, [theme]);
    (0, react_1.useEffect)(() => {
        const handler = (e) => {
            if (e.key === "theme" && e.newValue) {
                setTheme(e.newValue);
            }
        };
        window.addEventListener("storage", handler);
        return () => {
            window.removeEventListener("storage", handler);
        };
    }, [setTheme]);
    return ((0, jsx_runtime_1.jsx)(ThemeContext.Provider, { value: { theme, setTheme }, children: children }));
}
function useTheme() {
    const ctx = (0, react_1.useContext)(ThemeContext);
    if (!ctx)
        throw new Error("useTheme must be inside ThemeProvider"); // i18n-exempt -- developer guidance for incorrect hook usage
    return ctx;
}
