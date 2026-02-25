import type { Metadata } from "next";

import { type Locale, resolveLocale } from "@acme/i18n/locales";

import { PolicyPage } from "@/components/PolicyPage";
import { getPolicyContent, getSeoKeywords } from "@/lib/contentPacket";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getPolicyContent(lang, "privacy");
  return {
    title: `${content.title} | Caryina`,
    description: content.summary,
    keywords: getSeoKeywords(),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getPolicyContent(lang, "privacy");

  return (
    <PolicyPage
      title={content.title}
      summary={content.summary}
      bullets={content.bullets}
      notice={content.notice}
      sourcePath="docs/business-os/startup-baselines/HBAG-content-packet.md"
    />
  );
}
