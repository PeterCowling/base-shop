import type { Metadata } from "next";
import Section from "@/components/Section";
import PageHeader from "@/components/PageHeader";
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
    title: t("policy.privacy.meta.title"),
    description: t("policy.privacy.meta.description"),
    path: "/policies/privacy",
  });
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);

  const paragraphs = ["policy.privacy.p1", "policy.privacy.p2", "policy.privacy.p3"];

  return (
    <Section>
      <PageHeader
        eyebrow={t("policy.privacy.eyebrow")}
        title={t("policy.privacy.title")}
        description={t("policy.privacy.body")}
      />
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        {paragraphs.map((key) => (
          <p key={key}>{t(key)}</p>
        ))}
      </div>
    </Section>
  );
}
