import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/shop-bcd/src/app/[lang]/layout.tsx
import { Footer, Header } from "@ui";
import TranslationsProvider from "@i18n/Translations";
import { resolveLocale } from "@i18n/locales";
import { DefaultSeo } from "next-seo";
import { getSeo } from "../../lib/seo";
import "../globals.css";
export default async function LocaleLayout({ children, params, }) {
    /* `lang` will be `undefined` for `/`, or e.g. `"en"` for `/en`          */
    const { lang: langParam } = await params;
    const [raw] = langParam ?? [];
    const lang = resolveLocale(raw);
    /* Dynamic import of the locale JSON. Webpack bundles only en/de/it.     */
    const messages = (await import(
    /* webpackInclude: /(en|de|it)\.json$/ */
    `@i18n/${lang}.json`)).default;
    const seo = await getSeo(lang);
    return (_jsxs(TranslationsProvider, { messages: messages, children: [_jsx(DefaultSeo, { ...seo }), _jsx(Header, { lang: lang }), _jsx("main", { className: "min-h-[calc(100vh-8rem)]", children: children }), _jsx(Footer, {})] }));
}
