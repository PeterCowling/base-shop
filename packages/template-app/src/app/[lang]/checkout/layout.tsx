// packages/template-app/src/app/[lang]/layout.tsx

import "../../globals.css";

import type { ReactNode } from "react";

import { type Locale, resolveLocale } from "@acme/i18n/locales";
import TranslationsProvider from "@acme/i18n/Translations";
import Footer from "@acme/ui/components/layout/Footer";
import Header from "@acme/ui/components/layout/Header";

const localeMessagesLoaders: Record<Locale, () => Promise<Record<string, string>>> = {
  en: async () => (await import("@acme/i18n/en.json")).default as Record<string, string>, // i18n-exempt -- TURBO-220 [ttl=2026-12-31] static locale module path
  de: async () => (await import("@acme/i18n/de.json")).default as Record<string, string>, // i18n-exempt -- TURBO-220 [ttl=2026-12-31] static locale module path
  it: async () => (await import("@acme/i18n/it.json")).default as Record<string, string>, // i18n-exempt -- TURBO-220 [ttl=2026-12-31] static locale module path
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = resolveLocale(raw);
  const loadMessages = localeMessagesLoaders[lang] ?? localeMessagesLoaders.en;
  const messages = await loadMessages();

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
