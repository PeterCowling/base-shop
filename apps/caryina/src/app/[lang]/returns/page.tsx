import type { Metadata } from "next";

import { type Locale, resolveLocale } from "@acme/i18n/locales";

import { LegalDocumentPage } from "@/components/LegalDocumentPage";
import { ReturnsRequestForm } from "@/components/ReturnsRequestForm.client";
import { getSeoKeywords } from "@/lib/contentPacket";
import { getLegalDocument } from "@/lib/legalContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getLegalDocument(lang, "returns");
  return {
    title: `${content.title} | Caryina`,
    description: content.summary,
    keywords: getSeoKeywords(),
  };
}

export default async function ReturnsPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getLegalDocument(lang, "returns");

  return (
    <div className="space-y-10">
      <LegalDocumentPage document={content} lang={lang} currentKind="returns" />
      <ReturnsRequestForm />
    </div>
  );
}
