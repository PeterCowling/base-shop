// packages/template-app/src/app/[lang]/layout.tsx

import TranslationsProvider from "@i18n/Translations";
import { Locale, resolveLocale } from "@i18n/locales";
import Footer from "@ui/components/layout/Footer";
import Header from "@ui/components/layout/Header";
import { DefaultSeo } from "next-seo";
import type { ReactNode } from "react";
import { getSeo } from "../../lib/seo";
import "../globals.css";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang?: string }>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = resolveLocale(raw);

  const messages = (
    await import(
      /* webpackInclude: /(en|de|it)\.json$/ */
      `@i18n/${lang}.json`
    )
  ).default;
  const { alternate, ...seo } = await getSeo(lang);
  const linkTags = alternate.map(({ hrefLang, href }) => ({
    rel: "alternate",
    hrefLang,
    href,
  }));

  return (
    <TranslationsProvider messages={messages}>
      <DefaultSeo {...seo} additionalLinkTags={linkTags} />
      <Header lang={lang} />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer />
    </TranslationsProvider>
  );
}
