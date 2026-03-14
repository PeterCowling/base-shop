import type { Metadata } from "next";

import { type Locale, resolveLocale } from "@acme/i18n/locales";

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
  const content = getLegalDocument(lang, "terms");
  return {
    title: `${content.title} | Caryina`,
    description: content.summary,
    keywords: getSeoKeywords(),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getLegalDocument(lang, "terms");

  return (
    <LegalDocumentPage document={content} lang={lang} currentKind="terms" />
  );
}
