// apps/cms/src/app/[lang]/layout.tsx
import "../globals.css";

import Footer from "@ui/components/layout/Footer";
import Header from "@ui/components/layout/Header";

import { TranslationsProvider } from "@i18n/Translations";
import { Locale, resolveLocale } from "@i18n/locales";

import type { ReactNode } from "react";

/** Import English messages (EN-only configuration) */
import en from "@i18n/en.json";
import type { Messages } from "@/types/i18n";

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
  const messages: Messages = en;

  return (
    <TranslationsProvider messages={messages}>
      <Header lang={locale} />
      <main className="min-h-dvh">{children}</main>
      <Footer />
    </TranslationsProvider>
  );
}
