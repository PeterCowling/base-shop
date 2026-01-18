"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayoutProvider = LayoutProvider;
exports.useLayout = useLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const navigation_1 = require("next/navigation");
const react_1 = require("react");
const LayoutContext = (0, react_1.createContext)(undefined);
function LayoutProvider({ children }) {
    const [isMobileNavOpen, setIsMobileNavOpen] = (0, react_1.useState)(false);
    const [configuratorProgress, setConfiguratorProgress] = (0, react_1.useState)();
    const pathname = (0, navigation_1.usePathname)();
    const breadcrumbs = pathname ? pathname.split("/").filter(Boolean) : [];
    const toggleNav = () => setIsMobileNavOpen((v) => !v);
    return ((0, jsx_runtime_1.jsx)(LayoutContext.Provider, { value: {
            isMobileNavOpen,
            breadcrumbs,
            toggleNav,
            configuratorProgress,
            setConfiguratorProgress,
        }, children: children }));
}
function useLayout() {
    const ctx = (0, react_1.useContext)(LayoutContext);
    if (!ctx)
        throw new Error("useLayout must be inside LayoutProvider"); // i18n-exempt -- developer guidance for incorrect hook usage
    return ctx;
}
