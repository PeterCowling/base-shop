// apps/shop-bcd/src/app/[lang]/layout.tsx

import Footer from "@ui/components/layout/Footer";
import Header from "@ui/components/layout/Header";
import TranslationsProvider from "@i18n/Translations";
import { Locale, resolveLocale } from "@i18n/locales";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSeo } from "../../lib/seo";
import "../globals.css";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import shop from "../../../shop.json";
import { JsonLdScript, organizationJsonLd } from "../../lib/jsonld";

export async function generateMetadata({
  params,
}: {
  /** `[lang]` is now an *optional catch-all*, so the param is `string[] | undefined` */
  params: Promise<{ lang?: string[] }>;
}): Promise<Metadata> {
  const { lang: langParam } = await params;
  const [raw] = langParam ?? [];
  const lang: Locale = resolveLocale(raw);
  const [seo, settings] = await Promise.all([
    getSeo(lang),
    getShopSettings(shop.id),
  ]);
  const languages = settings.languages ?? ["en"];
  const baseCanonical = seo.canonical || undefined;
  const alternates: Metadata["alternates"] = { canonical: baseCanonical };
  if (baseCanonical) {
    const baseUrl = baseCanonical.replace(/\/$|$/, "");
    const canonicalRoot = baseUrl.endsWith(`/${lang}`)
      ? baseUrl.slice(0, -(`/${lang}`.length))
      : baseUrl;
    const map: Record<string, string> = {};
    for (const l of languages) {
      map[l] = `${canonicalRoot}/${l}`;
    }
    alternates.languages = map;
  }
  return {
    title: seo.title,
    description: seo.description,
    alternates,
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
      {/* Organization JSON-LD */}
      <JsonLdScript
        data={organizationJsonLd({
          name: shop.name ?? shop.id,
          logo: (await getShopSettings(shop.id)).seo?.[lang]?.image,
        })}
      />
      <Header lang={lang} />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer />
    </TranslationsProvider>
  );
}
