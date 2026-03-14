import type { Metadata } from "next";

import { type Locale, resolveLocale } from "@acme/i18n/locales";

import { CookiePreferencesPanel } from "@/components/CookiePreferencesPanel.client";
import { LegalDocumentPage } from "@/components/LegalDocumentPage";
import { getSeoKeywords } from "@/lib/contentPacket";
import { getLegalDocument } from "@/lib/legalContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getLegalDocument(lang, "cookie");
  return {
    title: `${content.title} | Caryina`,
    description: content.summary,
    keywords: getSeoKeywords(),
  };
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getLegalDocument(lang, "cookie");

  return (
    <div className="space-y-10">
      <CookiePreferencesPanel />
      <LegalDocumentPage document={content} lang={lang} currentKind="cookie" />
    </div>
  );
}
