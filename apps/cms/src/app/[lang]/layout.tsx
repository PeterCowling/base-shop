// apps/cms/src/app/[lang]/layout.tsx
import "../globals.css";

import type { ReactNode } from "react";

/** Import English messages (EN-only configuration) */
import en from "@acme/i18n/en.json";
import { type Locale, resolveLocale } from "@acme/i18n/locales";
import { TranslationsProvider } from "@acme/i18n/Translations";
import Footer from "@acme/ui/components/layout/Footer";
import Header from "@acme/ui/components/layout/Header";

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
