// packages/ui/components/cms/Breadcrumbs.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { getShopFromPath } from "@platform-core/utils/getShopFromPath";
import { usePathname } from "next/navigation";
import { memo, useEffect, useState } from "react";
import Breadcrumbs from "../molecules/Breadcrumbs";
const LABELS = {
    cms: null,
    shop: "Shop",
    products: "Products",
    pages: "Pages",
    media: "Media",
    settings: "Settings",
    live: "Live",
    rbac: "RBAC",
    wizard: "Create Shop",
    "account-requests": "Account Requests",
    builder: "Builder",
    edit: "Edit",
    seo: "SEO",
};
function BreadcrumbsInner() {
    const pathname = usePathname();
    const parts = pathname.split("/").filter(Boolean);
    const [extra, setExtra] = useState({});
    const shop = getShopFromPath(pathname);
    useEffect(() => {
        async function fetchLabels() {
            const segments = pathname.split("/").filter(Boolean);
            const shopSlug = shop;
            if (!shopSlug)
                return;
            const next = {};
            const prodIdx = segments.indexOf("products");
            if (prodIdx >= 0 && segments[prodIdx + 1]) {
                const id = segments[prodIdx + 1];
                try {
                    const res = await fetch(`/api/products/${shopSlug}/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        const title = data?.title ? Object.values(data.title)[0] : null;
                        if (title)
                            next[id] = title;
                    }
                }
                catch {
                    /* ignore fetch errors */
                }
            }
            const pageIdx = segments.indexOf("pages");
            if (pageIdx >= 0 && segments[pageIdx + 1]) {
                const slug = segments[pageIdx + 1];
                try {
                    const res = await fetch(`/api/pages/${shopSlug}`);
                    if (res.ok) {
                        const pages = await res.json();
                        const page = pages.find((p) => p.slug === slug) ?? null;
                        if (page?.seo?.title)
                            next[slug] = page.seo.title;
                    }
                }
                catch {
                    /* ignore fetch errors */
                }
            }
            setExtra(next);
        }
        fetchLabels();
    }, [pathname, shop]);
    let href = "";
    const items = [];
    for (const part of parts) {
        href += `/${part}`;
        const label = LABELS.hasOwnProperty(part)
            ? LABELS[part]
            : extra[part] || part;
        if (!label)
            continue;
        items.push({ label, href });
    }
    return _jsx(Breadcrumbs, { items: items });
}
export default memo(BreadcrumbsInner);
