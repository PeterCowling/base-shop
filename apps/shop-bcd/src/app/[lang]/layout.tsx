// apps/shop-bcd/src/app/[lang]/layout.tsx

import Footer from "@ui/components/layout/Footer";
import Header from "@ui/components/layout/Header";
import TranslationsProvider from "@i18n/Translations";
import { Locale, resolveLocale } from "@i18n/locales";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSeo } from "../../lib/seo";
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  /** `[lang]` is now an *optional catch-all*, so the param is `string[] | undefined` */
  params: Promise<{ lang?: string[] }>;
}): Promise<Metadata> {
  const { lang: langParam } = await params;
  const [raw] = langParam ?? [];
  const lang: Locale = resolveLocale(raw);
  const seo = await getSeo(lang);
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical || undefined },
    openGraph: seo.openGraph as Metadata["openGraph"],
    twitter: seo.twitter as Metadata["twitter"],
  };
}

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

  return (
    <TranslationsProvider messages={messages}>
      <Header lang={lang} />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer />
    </TranslationsProvider>
  );
}
