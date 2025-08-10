// apps/shop-bcd/src/app/[lang]/layout.tsx

import Footer from "@ui";
import Header from "@ui";
import TranslationsProvider from "@i18n/Translations";
import { Locale, resolveLocale } from "@i18n/locales";
import { DefaultSeo } from "next-seo";
import type { ReactNode } from "react";
import { getSeo } from "../../lib/seo";
import "../globals.css";

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
      <DefaultSeo {...seo} />
      <Header lang={lang} />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer />
    </TranslationsProvider>
  );
}
