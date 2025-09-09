import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function MarketingEmailTemplate({ logoSrc, shopName, headline, content, ctaLabel, ctaHref, footer, className, ...props }) {
    if (!headline || content == null) {
        throw new Error("headline and content are required");
    }
    if ((ctaLabel && !ctaHref) || (!ctaLabel && ctaHref)) {
        throw new Error("ctaLabel and ctaHref must both be provided");
    }
    const showCta = Boolean(ctaLabel && ctaHref);
    return (_jsxs("div", { className: `mx-auto w-full max-w-xl overflow-hidden rounded-md border text-sm${className ? ` ${className}` : ""}`, ...props, children: [logoSrc && shopName && (_jsx("div", { className: "bg-muted p-6 text-center", "data-token": "--color-muted", children: _jsx("img", { src: logoSrc, alt: shopName, width: 40, height: 40, style: { margin: "0 auto", height: "40px", width: "auto" } }) })), !logoSrc && shopName && (_jsx("div", { className: "bg-muted p-6 text-center", "data-token": "--color-muted", children: _jsx("span", { className: "font-bold", children: shopName }) })), _jsxs("div", { className: "space-y-4 p-6", children: [_jsx("h1", { className: "text-xl font-bold", children: headline }), _jsx("div", { className: "leading-6", children: content }), showCta && (_jsx("div", { className: "text-center", children: _jsx("a", { href: ctaHref, className: "bg-primary inline-block rounded-md px-4 py-2 font-medium", "data-token": "--color-primary", children: _jsx("span", { className: "text-primary-foreground", "data-token": "--color-primary-fg", children: ctaLabel }) }) }))] }), footer && (_jsx("div", { className: "bg-muted border-t p-4 text-center text-xs text-muted", "data-token": "--color-muted", children: footer }))] }));
}
