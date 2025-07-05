import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/shop-abc/src/app/[[...lang]]/layout.tsx
import { Footer, Header, SideNav } from "@/components/organisms";
import { AppShell } from "@/components/templates/AppShell";
import TranslationsProvider from "@i18n/Translations";
import { resolveLocale } from "@i18n/locales";
import { DefaultSeo } from "next-seo";
import "../globals.css";
import { getSeo } from "../lib/seo";
export default async function LocaleLayout({ children, params, }) {
    /* `lang` will be `undefined` for `/`, or e.g. `"en"` for `/en` */
    const { lang: raw } = await params;
    const lang = resolveLocale(raw);
    /* Dynamic import of the locale JSON. Webpack bundles only en/de/it.     */
    const messages = (await import(
    /* webpackInclude: /(en|de|it)\.json$/ */
    `@i18n/${lang}.json`)).default;
    const seo = await getSeo(lang);
    return (_jsxs(TranslationsProvider, { messages: messages, children: [_jsx(DefaultSeo, { ...seo }), _jsx(AppShell, { header: _jsx(Header, { locale: lang }), sideNav: _jsx(SideNav, {}), footer: _jsx(Footer, {}), children: children })] }));
}
