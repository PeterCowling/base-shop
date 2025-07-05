import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
// apps/cms/src/app/cms/shop/[shop]/settings/seo/page.tsx
import { getSettings } from "@cms/actions/shops.server";
import dynamic from "next/dynamic";
const SeoEditor = dynamic(() => import("./SeoEditor"));
void SeoEditor;
export const revalidate = 0;
export default async function SeoSettingsPage({ params, }) {
    const { shop } = await params;
    const settings = await getSettings(shop);
    const languages = settings.languages;
    const seo = settings.seo ?? {};
    const freeze = settings.freezeTranslations ?? false;
    return (_jsxs("div", { children: [_jsxs("h2", { className: "mb-4 text-xl font-semibold", children: ["SEO \u2013 ", shop] }), _jsx(SeoEditor, { shop: shop, languages: languages, initialSeo: seo, initialFreeze: freeze })] }));
}
