import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../../utils/style";
/**
 * Basic, unopinionated table primitives (shadcn-ui style).
 * Each component forwards props / className so you can style with Tailwind.
 */
export function Table({ className, ...props }) {
    return (_jsx("div", { className: "w-full overflow-x-auto", children: _jsx("table", { className: cn("text-foreground w-full text-left text-sm", className), ...props }) }));
}
export function TableHeader({ className, ...props }) {
    return _jsx("thead", { className: cn("bg-muted/50 border-b", className), ...props });
}
export function TableBody({ className, ...props }) {
    return _jsx("tbody", { className: cn(className), ...props });
}
export function TableRow({ className, ...props }) {
    return (_jsx("tr", { className: cn("hover:bg-muted/25 data-[state=selected]:bg-muted border-b transition-colors", className), ...props }));
}
export function TableHead({ className, ...props }) {
    return (_jsx("th", { className: cn("text-foreground px-4 py-2 font-semibold", className), ...props }));
}
export function TableCell({ className, ...props }) {
    return _jsx("td", { className: cn("px-4 py-2 align-middle", className), ...props });
}
