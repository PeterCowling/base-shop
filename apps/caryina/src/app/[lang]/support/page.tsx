import type { Metadata } from "next";

import { type Locale, resolveLocale } from "@acme/i18n/locales";

import {
  getSeoKeywords,
  getSupportContent,
} from "@/lib/contentPacket";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getSupportContent(lang);
  return {
    title: `${content.title} | Caryina`,
    description: content.summary,
    keywords: getSeoKeywords(),
  };
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const content = getSupportContent(lang);

  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-display">{content.title}</h1>
      <p className="max-w-2xl text-muted-foreground">
        {content.summary}
      </p>

      <div className="max-w-3xl rounded-lg border p-6 text-sm text-muted-foreground">
        <h2 className="text-base font-medium text-foreground">Support channels</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {content.channels.map((channel) => (
            <li key={channel}>{channel}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm">{content.responseSla}</p>
      </div>
    </section>
  );
}
