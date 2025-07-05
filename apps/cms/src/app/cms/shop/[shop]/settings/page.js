import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
// apps/cms/src/app/cms/shop/[shop]/settings/page.tsx
import { authOptions } from "@cms/auth/options";
import { checkShopExists } from "@lib/checkShopExists.server";
import { readSettings, readShop, } from "@platform-core/repositories/json.server";
import { getServerSession } from "next-auth";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
const ShopEditor = dynamic(() => import("./ShopEditor"));
void ShopEditor;
export const revalidate = 0;
export default async function SettingsPage({ params, }) {
    const { shop } = await params;
    if (!(await checkShopExists(shop)))
        return notFound();
    const [session, settings, info] = await Promise.all([
        getServerSession(authOptions),
        readSettings(shop),
        readShop(shop),
    ]);
    const isAdmin = session
        ? ["admin", "ShopAdmin", "CatalogManager", "ThemeEditor"].includes(session.user.role)
        : false;
    return (_jsxs("div", { children: [_jsxs("h2", { className: "mb-4 text-xl font-semibold", children: ["Settings \u2013 ", shop] }), _jsx("p", { className: "mb-4 text-sm", children: _jsx(Link, { href: `/cms/shop/${shop}/settings/seo`, className: "text-primary underline", children: "SEO settings" }) }), _jsx("h3", { className: "mt-4 font-medium", children: "Languages" }), _jsx("ul", { className: "mt-2 list-disc pl-5 text-sm", children: settings.languages.map((l) => (_jsx("li", { children: l.toUpperCase() }, l))) }), _jsx("h3", { className: "mt-4 font-medium", children: "Theme" }), _jsx("p", { className: "mt-2 text-sm", children: info.themeId }), _jsx("h3", { className: "mt-4 font-medium", children: "Theme Tokens" }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx("pre", { className: "rounded bg-gray-50 p-2 text-sm", children: JSON.stringify(info.themeTokens, null, 2) }), Object.keys(info.themeTokens ?? {}).length === 0 && (_jsx("span", { className: "text-muted-foreground text-xs", children: "(using theme defaults)" }))] }), _jsx("h3", { className: "mt-4 font-medium", children: "Catalog Filters" }), _jsx("p", { className: "mt-2 text-sm", children: info.catalogFilters.join(", ") }), _jsx("h3", { className: "mt-4 font-medium", children: "Filter Mappings" }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx("pre", { className: "rounded bg-gray-50 p-2 text-sm", children: JSON.stringify(info.filterMappings, null, 2) }), Object.keys(info.filterMappings ?? {}).length === 0 && (_jsx("span", { className: "text-muted-foreground text-xs", children: "(using theme defaults)" }))] }), isAdmin && (_jsx("div", { className: "mt-6", children: _jsx(ShopEditor, { shop: shop, initial: info }) })), !isAdmin && (_jsxs("p", { className: "mt-4 rounded-md bg-yellow-50 p-2 text-sm text-yellow-700", children: ["You are signed in as a ", _jsx("b", { children: "viewer" }), ". Editing is disabled."] }))] }));
}
