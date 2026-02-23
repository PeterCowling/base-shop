// packages/template-app/src/app/[lang]/layout.tsx
import type { ReactNode } from "react";
import type { Metadata } from "next";

import { TranslationsProvider } from "@acme/i18n";
import { type Locale, resolveLocale } from "@acme/i18n/locales";

import { getSeo, serializeJsonLd } from "../../lib/seo";

const localeMessagesLoaders: Record<Locale, () => Promise<Record<string, string>>> = {
  en: async () => (await import("@acme/i18n/en.json")).default as Record<string, string>, // i18n-exempt -- TURBO-220 [ttl=2026-12-31] static locale module path
  de: async () => (await import("@acme/i18n/de.json")).default as Record<string, string>, // i18n-exempt -- TURBO-220 [ttl=2026-12-31] static locale module path
  it: async () => (await import("@acme/i18n/it.json")).default as Record<string, string>, // i18n-exempt -- TURBO-220 [ttl=2026-12-31] static locale module path
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang: Locale = resolveLocale(raw);
  const seo = await getSeo(lang);

  // Convert next-seo images to Next.js Metadata format, filtering out nulls
  const ogImages = seo.openGraph?.images
    ? [...seo.openGraph.images].map((img) => ({
        url: typeof img === "string" ? img : img.url,
        ...(typeof img !== "string" && img.width != null ? { width: img.width } : {}),
        ...(typeof img !== "string" && img.height != null ? { height: img.height } : {}),
        ...(typeof img !== "string" && img.alt ? { alt: img.alt } : {}),
      }))
    : undefined;

  return {
    title: seo.title,
    description: seo.description,
    openGraph: seo.openGraph
      ? {
          title: seo.openGraph.title ?? seo.title ?? undefined,
          description: seo.openGraph.description ?? seo.description ?? undefined,
          url: seo.openGraph.url ?? undefined,
          siteName: seo.openGraph.siteName ?? undefined,
          images: ogImages,
          locale: seo.openGraph.locale ?? undefined,
          type: (seo.openGraph.type as "website" | "article") ?? "website",
        }
      : undefined,
    twitter: seo.twitter
      ? {
          card: (seo.twitter.cardType as "summary" | "summary_large_image") ?? "summary",
          site: seo.twitter.site ?? undefined,
          title: seo.title ?? undefined,
          description: seo.description ?? undefined,
        }
      : undefined,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
  };
}

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
  const seo = await getSeo(lang);

  return (
    <TranslationsProvider messages={messages}>
      {seo.structuredData && (
        <script
          // i18n-exempt -- SEO-342 [ttl=2026-12-31] JSON-LD script type
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(seo.structuredData) }}
        />
      )}
      {children}
    </TranslationsProvider>
  );
}
