// apps/cms/src/app/[lang]/layout.tsx
import "../globals.css";

import Footer from "@ui/components/layout/Footer";
import Header from "@ui/components/layout/Header";

import { TranslationsProvider } from "@i18n/Translations";
import { Locale, resolveLocale } from "@i18n/locales";

import type { ReactNode } from "react";

/** Eager-import the three locale JSON files so webpack can statically analyse them. */
import de from "@i18n/de.json";
import en from "@i18n/en.json";
import it from "@i18n/it.json";

const MESSAGES: Record<Locale, typeof en> = { en, de, it };

/** Layout for every route under `/[lang]/*` */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang?: string }>;
}) {
  const { lang: raw } = await params;
  const locale: Locale = resolveLocale(raw);
  const messages = MESSAGES[locale];

  return (
    <TranslationsProvider messages={messages}>
      <Header lang={locale} />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer />
    </TranslationsProvider>
  );
}
