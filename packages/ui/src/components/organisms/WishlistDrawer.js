import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { drawerWidthProps } from "../../utils/style/drawerWidth";
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger, } from "../atoms/shadcn";
/**
 * Slide-over panel listing products added to the user's wishlist.
 * Accepts an external trigger element to open the drawer.
 */
export function WishlistDrawer({ trigger, items, width = "20rem", }) {
    const { widthClass, style } = drawerWidthProps(width);
    return (_jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: trigger }), _jsxs(DialogContent, { style: style, className: cn("bg-background fixed top-0 right-0 z-50 h-full max-w-full translate-x-full overflow-y-auto border-l p-6 shadow-lg transition-transform data-[state=open]:translate-x-0", widthClass), children: [_jsx(DialogTitle, { className: "mb-4", children: "Wishlist" }), items.length === 0 ? (_jsx("p", { className: "text-muted-foreground text-sm", children: "Your wishlist is empty." })) : (_jsx("ul", { className: "space-y-3", children: items.map((item) => (_jsxs("li", { className: "flex items-center justify-between gap-2 border-b pb-2 last:border-b-0", children: [_jsx("span", { children: item.title }), _jsx(Button, { variant: "outline", className: "h-8 px-2", children: "View" })] }, item.id))) }))] })] }));
}
