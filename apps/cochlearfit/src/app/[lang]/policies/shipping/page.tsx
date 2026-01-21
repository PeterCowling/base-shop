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
    title: t("policy.shipping.meta.title"),
    description: t("policy.shipping.meta.description"),
    path: "/policies/shipping",
  });
}

export default async function ShippingPolicyPage({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);

  const paragraphs = ["policy.shipping.p1", "policy.shipping.p2", "policy.shipping.p3"];

  return (
    <Section>
      <PageHeader
        eyebrow={t("policy.shipping.eyebrow")}
        title={t("policy.shipping.title")}
        description={t("policy.shipping.body")}
      />
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        {paragraphs.map((key) => (
          <p key={key}>{t(key)}</p>
        ))}
      </div>
    </Section>
  );
}
