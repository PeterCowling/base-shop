// src/app/[lang]/layout.tsx
import "@/app/globals.css";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { TranslationsProvider } from "@/i18n/Translations";
import { Locale, resolveLocale } from "@/i18n/locales";
import type { ReactNode } from "react";

/**
 * Layout for every route under /[lang]/…
 * Next 15 delivers `params` as a Promise, so we must `await` it.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang?: string }>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = resolveLocale(raw);
  const messages = (await import(`@/i18n/${lang}.json`)).default;

  return (
    <TranslationsProvider messages={messages}>
      <Header lang={lang} />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer />
    </TranslationsProvider>
  );
}
