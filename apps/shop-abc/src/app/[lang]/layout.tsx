// apps/shop-abc/src/app/[[...lang]]/layout.tsx

import { Footer, Header, SideNav, AppShell } from "@ui";
import TranslationsProvider from "@i18n/Translations";
import { Locale, resolveLocale } from "@i18n/locales";
import { DefaultSeo } from "next-seo";
import type { ReactNode } from "react";
import "../globals.css";
import { getSeo } from "../lib/seo";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  /**
   * Next 15 provides `params` as a Promise.
   * `[lang]` is optional so it may be `undefined`.
   */
  params: Promise<{ lang?: string }>;
}) {
  /* `lang` will be `undefined` for `/`, or e.g. `"en"` for `/en` */
  const { lang: raw } = await params;

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
      <AppShell
        header={<Header locale={lang} />}
        sideNav={<SideNav />}
        footer={<Footer />}
      >
        {children}
      </AppShell>
    </TranslationsProvider>
  );
}
