// src/app/[lang]/guides/[slug]/page.tsx
// App Router redirect page: /[lang]/guides/[slug] → /[lang]/[namespace]/[slug]
// This handles legacy /guides/ URLs by redirecting to the correct namespace
// Uses client-side redirect + meta refresh for static export compatibility
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Section } from "@acme/ui/atoms";

import { GUIDE_SLUG_LOOKUP_BY_LANG } from "@/guides/slugs/lookups";
import { guideNamespace } from "@/guides/slugs/namespaces";
import { guideSlug } from "@/guides/slugs/urls";
import { type AppLanguage, i18nConfig } from "@/i18n.config";

import RedirectClient from "./RedirectClient";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

// Generate static params for all guide slugs across all languages
export async function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];
  const supported = i18nConfig.supportedLngs as readonly AppLanguage[];

  for (const lang of supported) {
    const lookup = GUIDE_SLUG_LOOKUP_BY_LANG[lang];
    if (lookup) {
      for (const slug of Object.keys(lookup)) {
        params.push({ lang, slug });
      }
    }
  }

  return params;
}

// Build destination URL for a given lang + slug
function getDestination(lang: AppLanguage, slug: string): string | null {
  const lookup = GUIDE_SLUG_LOOKUP_BY_LANG[lang];
  const key = lookup?.[slug];
  if (!key) return null;

  const base = guideNamespace(lang, key);
  return `/${lang}/${base.baseSlug}/${guideSlug(lang, key)}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const validLang = i18nConfig.supportedLngs.includes(lang as AppLanguage)
    ? (lang as AppLanguage)
    : (i18nConfig.fallbackLng as AppLanguage);

  const destination = getDestination(validLang, slug);

  if (!destination) {
    return {
      robots: { index: false, follow: false },
    };
  }

  return {
    robots: { index: false, follow: true },
    alternates: { canonical: destination },
    other: {
      // Meta refresh for browsers without JS
      refresh: `0; url=${destination}`,
    },
  };
}

export default async function LegacyGuidePage({ params }: Props) {
  const { lang, slug } = await params;
  const validLang = i18nConfig.supportedLngs.includes(lang as AppLanguage)
    ? (lang as AppLanguage)
    : (i18nConfig.fallbackLng as AppLanguage);

  const destination = getDestination(validLang, slug);

  if (!destination) {
    notFound();
  }

  return (
    <Section
      as="main"
      padding="none"
      width="full"
      className="mx-auto mt-24 max-w-md px-6 text-center"
    >
      <h1 className="text-2xl font-semibold">Redirecting...</h1>
      <p className="mt-3 text-sm text-brand-text/70">
        If you are not redirected automatically,{" "}
        <a
          className="inline-flex min-h-11 min-w-11 items-center justify-center underline"
          href={destination}
        >
          click here
        </a>
        .
      </p>
      <RedirectClient destination={destination} />
    </Section>
  );
}
