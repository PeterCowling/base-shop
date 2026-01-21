// apps/cover-me-pretty/src/app/[lang]/layout.tsx

import Footer from "@acme/ui/components/layout/Footer";
import Header from "@acme/ui/components/layout/Header";
import TranslationsProvider from "@acme/i18n/Translations";
import { Locale, resolveLocale } from "@acme/i18n/locales";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSeo } from "../../lib/seo";
import "../globals.css";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import shop from "../../../shop.json";
import { JsonLdScript, organizationJsonLd } from "../../lib/jsonld";
import { ThemeStyle } from "@acme/ui/server";

export async function generateMetadata({
  params,
}: {
  /** `[lang]` is now an *optional catch-all*, so the param is `string[] | undefined` */
  params: Promise<{ lang?: string[] }>;
}): Promise<Metadata> {
  const { lang: langParam } = await params;
  const [raw] = langParam ?? [];
  const lang: Locale = resolveLocale(raw);

  try {
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
  } catch {
    // Fallback metadata when SEO/settings resolution fails
    return {
      title: shop.name ?? shop.id, // i18n-exempt -- SEO-1234 [ttl=2025-12-31] LHCI fallback title
    };
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  /** `[lang]` is now an *optional catch-all*, so the param is `string[] | undefined` */
  params: Promise<{ lang?: string[] }>;
}) {
  try {
    /* `lang` will be `undefined` for `/`, or e.g. `"en"` for `/en`          */
    const { lang: langParam } = await params;
    const [raw] = langParam ?? [];
    const lang: Locale = resolveLocale(raw);

    /* Dynamic import of the locale JSON. Webpack bundles only en/de/it.     */
    const messages = (
      await import(
        /* webpackInclude: /(en|de|it|fr|es|ja|ko)\.json$/ */
        `@acme/i18n/${lang}.json`
      )
    ).default;

    let logo: string | undefined;
    try {
      logo = (await getShopSettings(shop.id)).seo?.[lang]?.image;
    } catch {
      logo = undefined;
    }

    return (
      <TranslationsProvider messages={messages}>
        {/* Inject per-shop theme tokens and fonts */}
        <ThemeStyle shopId={shop.id} />
        {/* Organization JSON-LD */}
        <JsonLdScript
          data={organizationJsonLd({
            name: shop.name ?? shop.id,
            logo,
          })}
        />
        <Header lang={lang} />
        <main className="min-h-dvh">{children}</main>
        <Footer />
      </TranslationsProvider>
    );
  } catch {
    // Fallback layout when locale/theme/SEO wiring fails; still render content for LHCI & users
    return <main className="min-h-dvh">{children}</main>;
  }
}
