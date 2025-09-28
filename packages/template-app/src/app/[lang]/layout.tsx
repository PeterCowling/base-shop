// packages/template-app/src/app/[lang]/layout.tsx
import { TranslationsProvider } from "@acme/i18n";
import { resolveLocale, type Locale } from "@i18n/locales";
import type { ReactNode } from "react";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang?: string[] | string }>;
}) {
  const raw = (await params).lang;
  const code = Array.isArray(raw) ? raw[0] : raw;
  const lang: Locale = resolveLocale(code);
  const messages = (
    await import(
      /* webpackInclude: /(en|de|it)\.json$/ */
      `@i18n/${lang}.json`
    )
  ).default as Record<string, string>;

  return (
    <TranslationsProvider messages={messages}>{children}</TranslationsProvider>
  );
}

