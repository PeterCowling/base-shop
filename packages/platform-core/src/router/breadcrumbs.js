"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBreadcrumbs = getBreadcrumbs;
/**
 * Minimal breadcrumbs helper. When a collection tree is not available,
 * it falls back to deriving labels from the URL path segments.
 */
function getBreadcrumbs(pathname, title) {
    const segments = pathname.split("?")[0].split("#")[0].split("/").filter(Boolean);
    const crumbs = [{ href: "/", label: "Home" }];
    let acc = "";
    for (let i = 0; i < segments.length; i++) {
        acc += `/${segments[i]}`;
        const isLast = i === segments.length - 1;
        const label = isLast && title ? title : decodeURIComponent(segments[i]).replace(/[-_]/g, " ");
        crumbs.push({ href: acc, label });
    }
    return crumbs;
}
