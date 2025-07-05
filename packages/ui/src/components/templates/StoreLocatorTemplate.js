import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
/**
 * Display a map alongside a list of store locations.
 */
export function StoreLocatorTemplate({ stores, map, className, ...props }) {
    return (_jsxs("div", { className: cn("grid gap-6 md:grid-cols-2", className), ...props, children: [_jsx("div", { className: "min-h-[300px] w-full", children: map ?? _jsx("div", { className: "bg-muted h-full w-full rounded-md" }) }), _jsx("ul", { className: "space-y-4", children: stores.map((store) => (_jsxs("li", { className: "rounded-md border p-4", children: [_jsx("h3", { className: "font-semibold", children: store.name }), _jsx("p", { className: "text-muted-foreground text-sm", children: store.address })] }, store.id))) })] }));
}
