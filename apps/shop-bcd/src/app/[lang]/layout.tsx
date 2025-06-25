// apps/shop-bcd/src/app/[lang]/layout.tsx

import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { TranslationsProvider } from "@i18n/Translations";
import { Locale, resolveLocale } from "@i18n/locales";
import type { ReactNode } from "react";
import "../globals.css";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  /** `[lang]` is now an *optional catch-all*, so the param is `string[] | undefined` */
  params: { lang?: string[] };
}) {
  /* `lang` will be `undefined` for `/`, or e.g. `"en"` for `/en`          */
  const [raw] = params.lang ?? [];
  const lang: Locale = resolveLocale(raw);
  /* Dynamic import of the locale JSON. Webpack bundles only en/de/it.     */
  const messages = (
    await import(
      /* webpackInclude: /(en|de|it)\.json$/ */
      `@i18n/${lang}.json`
    )
  ).default;

  return (
    <TranslationsProvider messages={messages}>
      <Header lang={lang} />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer />
    </TranslationsProvider>
  );
}
