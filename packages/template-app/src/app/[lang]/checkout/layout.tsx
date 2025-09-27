// packages/template-app/src/app/[lang]/layout.tsx

import TranslationsProvider from "@i18n/Translations";
import { Locale, resolveLocale } from "@i18n/locales";
import Footer from "@ui/components/layout/Footer";
import Header from "@ui/components/layout/Header";
import { DefaultSeo } from "next-seo";
import type { ReactNode } from "react";
import { getSeo } from "../../../lib/seo";
import "../../globals.css";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  /** `[lang]` is now an *optional catch-all*, so the param is `string[] | undefined` */
  params: Promise<{ lang?: string[] }>;
}) {
  /* `lang` will be `undefined` for `/`, or e.g. `"en"` for `/en`          */
  const { lang: langParam } = await params;
  const [raw] = langParam ?? [];
  const lang: Locale = resolveLocale(raw);

  /* Dynamic import of the locale JSON. Webpack bundles only en/de/it.     */
  const messages = (
    await import(
      /* webpackInclude: /(en|de|it)\.json$/ */
      `@i18n/${lang}.json`
    )
  ).default;
  const seo = await getSeo(lang);

  return (
    <TranslationsProvider messages={messages}>
      <DefaultSeo {...seo} additionalLinkTags={seo.additionalLinkTags} />
      <div className="min-h-screen flex flex-col">
        <Header lang={lang} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </TranslationsProvider>
  );
}
