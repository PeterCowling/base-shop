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
    title: t("policy.terms.meta.title"),
    description: t("policy.terms.meta.description"),
    path: "/policies/terms",
  });
}

export default async function TermsPolicyPage({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);

  const paragraphs = ["policy.terms.p1", "policy.terms.p2", "policy.terms.p3"];

  return (
    <Section>
      <PageHeader
        eyebrow={t("policy.terms.eyebrow")}
        title={t("policy.terms.title")}
        description={t("policy.terms.body")}
      />
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        {paragraphs.map((key) => (
          <p key={key}>{t(key)}</p>
        ))}
      </div>
    </Section>
  );
}
