// packages/ui/components/cms/TopBar.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayout } from "@platform-core/contexts/LayoutContext";
import { getShopFromPath } from "@platform-core/utils/getShopFromPath";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo } from "react";
import { Button } from "../atoms-shadcn";
import Breadcrumbs from "./Breadcrumbs.client";
import ShopSelector from "./ShopSelector";
function TopBarInner() {
    const router = useRouter();
    const pathname = usePathname();
    const { toggleNav } = useLayout();
    const segments = pathname.split("/").filter(Boolean);
    const shop = getShopFromPath(pathname);
    const last = segments[segments.length - 1];
    const showNewProduct = shop && last === "products";
    const showNewPage = shop && last === "pages";
    return (_jsxs("header", { className: "bg-background/60 flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2 backdrop-blur dark:border-gray-800", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: "ghost", className: "sm:hidden", onClick: toggleNav, children: [_jsx("span", { className: "sr-only", children: "Toggle navigation" }), "\u2630"] }), _jsx(Link, { href: "/cms", className: "focus-visible:ring-primary rounded-md px-3 py-2 text-sm hover:bg-gray-100 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-gray-800", children: "Home" }), _jsx(Breadcrumbs, {}), _jsx(ShopSelector, {})] }), _jsxs("div", { className: "flex items-center gap-2", children: [showNewProduct && (_jsx(Link, { href: `/cms/shop/${shop}/products/new`, className: "bg-primary hover:bg-primary/90 rounded-md px-3 py-2 text-sm text-white", children: "New product" })), showNewPage && (_jsx(Link, { href: `/cms/shop/${shop}/pages/new/builder`, className: "bg-primary hover:bg-primary/90 rounded-md px-3 py-2 text-sm text-white", children: "New page" })), _jsx(Button, { variant: "outline", onClick: () => router.refresh(), children: "Refresh" }), _jsx(Button, { variant: "ghost", onClick: () => signOut({ callbackUrl: "/login" }), children: "Sign\u00A0out" })] })] }));
}
export default memo(TopBarInner);
