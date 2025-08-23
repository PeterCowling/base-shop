import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
export function MarketingEmailTemplate({ logoSrc, headline, content, ctaLabel, ctaHref, footer, className, ...props }) {
    return (_jsxs("div", { className: cn("mx-auto w-full max-w-xl overflow-hidden rounded-md border text-sm", className), ...props, children: [logoSrc && (_jsx("div", { className: "bg-muted p-6 text-center", "data-token": "--color-muted", children: _jsx(Image, { src: logoSrc, alt: "logo", width: 40, height: 40, className: "mx-auto h-10 w-auto" }) })), _jsxs("div", { className: "space-y-4 p-6", children: [_jsx("h1", { className: "text-xl font-bold", children: headline }), _jsx("div", { className: "leading-6", children: content }), ctaLabel && ctaHref && (_jsx("div", { className: "text-center", children: _jsx("a", { href: ctaHref, className: "bg-primary inline-block rounded-md px-4 py-2 font-medium", "data-token": "--color-primary", children: _jsx("span", { className: "text-primary-foreground", "data-token": "--color-primary-fg", children: ctaLabel }) }) }))] }), footer && (_jsx("div", { className: "bg-muted border-t p-4 text-center text-xs text-muted", "data-token": "--color-muted", children: footer }))] }));
}
