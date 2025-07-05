// packages/ui/components/cms/Sidebar.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getShopFromPath } from "@platform-core/utils/getShopFromPath";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function Sidebar({ role }) {
    const pathname = usePathname() ?? "";
    const shop = getShopFromPath(pathname);
    const links = [
        { href: shop ? `/shop/${shop}` : "", label: "Dashboard", icon: "📊" },
        ...(shop ? [] : [{ href: "/shop", label: "Shops", icon: "🏬" }]),
        {
            href: shop ? `/shop/${shop}/products` : "/products",
            label: "Products",
            icon: "📦",
        },
        ...(shop
            ? [
                {
                    href: `/shop/${shop}/products/new`,
                    label: "New Product",
                    icon: "➕",
                },
            ]
            : []),
        {
            href: shop ? `/shop/${shop}/pages` : "/pages",
            label: "Pages",
            icon: "📄",
        },
        ...(shop
            ? [
                {
                    href: `/shop/${shop}/pages/new/builder`,
                    label: "New Page",
                    icon: "📝",
                },
            ]
            : []),
        {
            href: shop ? `/shop/${shop}/media` : "/media",
            label: "Media",
            icon: "🖼️",
        },
        {
            href: shop ? `/shop/${shop}/settings` : "/settings",
            label: "Settings",
            icon: "⚙️",
        },
        ...(shop
            ? [
                {
                    href: `/shop/${shop}/settings/seo`,
                    label: "SEO",
                    icon: "🔍",
                },
            ]
            : []),
        { href: "/live", label: "Live", icon: "🌐" },
        ...(role === "admin"
            ? [
                {
                    href: "/rbac",
                    label: "RBAC",
                    icon: "🛡️",
                    title: "Manage user roles",
                },
                {
                    href: "/account-requests",
                    label: "Account Requests",
                    icon: "📥",
                    title: "Approve new users",
                },
                {
                    href: "/wizard",
                    label: "Create Shop",
                    icon: "🛍️",
                    title: "Create a new shop",
                },
            ]
            : []),
    ];
    const dashboardBase = shop ? `/cms/shop/${shop}` : "/cms";
    return (_jsxs("aside", { className: "w-56 shrink-0 border-r border-gray-200 dark:border-gray-800", children: [_jsx("h1", { className: "px-4 py-6 text-lg font-semibold tracking-tight", children: "CMS" }), _jsx("nav", { className: "flex flex-col gap-1 px-2", children: links.map(({ href, label, icon, title }) => {
                    const fullHref = `/cms${href}`;
                    const isDashboardLink = label === "Dashboard";
                    const isShopIndexLink = label === "Shops";
                    const active = isDashboardLink
                        ? pathname === dashboardBase
                        : isShopIndexLink
                            ? pathname === fullHref
                            : pathname.startsWith(fullHref);
                    return (_jsxs(Link, { href: fullHref, "aria-current": active ? "page" : undefined, className: `focus-visible:ring-primary flex items-center gap-2 rounded-md px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none ${active ? "bg-primary/10 font-medium" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`, title: title, children: [_jsx("span", { "aria-hidden": "true", children: icon }), label] }, href));
                }) })] }));
}
