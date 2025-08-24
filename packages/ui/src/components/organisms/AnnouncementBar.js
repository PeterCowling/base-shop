"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
/**
 * Simple announcement bar that can display a message with an optional link
 * and close button. When `href` is provided the entire bar becomes a link.
 */
export default function AnnouncementBar({ text, href, closable = false, className, ...props }) {
    const [open, setOpen] = React.useState(true);
    if (!open || !text)
        return null;
    const content = (_jsxs("div", { className: cn("flex w-full items-center justify-center gap-2 bg-primary px-4 py-2 text-sm", className), "data-token": "--color-primary", ...props, children: [_jsx("span", { className: "text-primary-foreground", "data-token": "--color-primary-fg", children: text }), closable && (_jsx("button", { type: "button", "aria-label": "Close announcement", onClick: () => setOpen(false), className: "ml-2 text-primary-foreground/70 hover:text-primary-foreground", "data-token": "--color-primary-fg", children: "\u00D7" }))] }));
    return href ? (_jsx("a", { href: href, className: "block w-full", children: content })) : (content);
}
