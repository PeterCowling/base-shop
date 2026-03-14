import type { Metadata } from "next";

import { type Locale, resolveLocale } from "@acme/i18n/locales";

import { getAboutContent, getSeoKeywords } from "@/lib/contentPacket";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getAboutContent(lang);
  return {
    title: `${content.title} | Caryina`,
    description: content.summary,
    keywords: getSeoKeywords(),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getAboutContent(lang);

  return (
    <section className="space-y-6">
      <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
        {content.eyebrow}
      </p>
      <h1 className="text-4xl font-display">{content.title}</h1>

      {/* TODO: PLACEHOLDER — operator to supply hero image before scaling traffic */}

      <div className="max-w-3xl rounded-lg border p-6 text-sm text-muted-foreground">
        <div className="space-y-4">
          {content.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
