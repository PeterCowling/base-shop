// packages/template-app/src/app/[lang]/layout.tsx

import "../../globals.css";

import type { ReactNode } from "react";

import { type Locale, resolveLocale } from "@acme/i18n/locales";
import TranslationsProvider from "@acme/i18n/Translations";
import Footer from "@acme/ui/components/layout/Footer";
import Header from "@acme/ui/components/layout/Header";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = resolveLocale(raw);

  /* Dynamic import of the locale JSON. Webpack bundles only en/de/it.     */
  const messages = (
    await import(
      /* webpackInclude: /(en|de|it)\.json$/ */
      `@acme/i18n/${lang}.json`
    )
  ).default;

  return (
    <TranslationsProvider messages={messages}>
      <div className="min-h-screen flex flex-col">
        <Header lang={lang} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </TranslationsProvider>
  );
}
