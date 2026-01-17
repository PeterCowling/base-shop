// packages/template-app/src/app/[lang]/layout.tsx
import { TranslationsProvider } from "@acme/i18n";
import { resolveLocale, type Locale } from "@acme/i18n/locales";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSeo, serializeJsonLd } from "../../lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string[] | string }>;
}): Promise<Metadata> {
  const raw = (await params).lang;
  const code = Array.isArray(raw) ? raw[0] : raw;
  const lang: Locale = resolveLocale(code);
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
  params: Promise<{ lang?: string[] | string }>;
}) {
  const raw = (await params).lang;
  const code = Array.isArray(raw) ? raw[0] : raw;
  const lang: Locale = resolveLocale(code);
  const messages = (
    await import(
      /* webpackInclude: /(en|de|it)\.json$/ */
      `@acme/i18n/${lang}.json`
    )
  ).default as Record<string, string>;
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
