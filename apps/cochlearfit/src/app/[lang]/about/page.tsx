import type { Metadata } from "next";

import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import { resolveLocale } from "@/lib/locales";
import { createTranslator, loadMessages } from "@/lib/messages";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);

  return buildMetadata({
    locale,
    title: t("about.meta.title"),
    description: t("about.meta.description"),
    path: "/about",
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);

  const paragraphs = ["about.p1", "about.p2", "about.p3"];

  return (
    <Section>
      <PageHeader
        eyebrow={t("about.eyebrow")}
        title={t("about.title")}
        description={t("about.body")}
      />
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        {paragraphs.map((key) => (
          <p key={key}>{t(key)}</p>
        ))}
      </div>
    </Section>
  );
}
