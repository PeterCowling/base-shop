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
    title: t("faq.meta.title"),
    description: t("faq.meta.description"),
    path: "/faq",
  });
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);

  const faqKeys = ["faq.q1", "faq.q2", "faq.q3", "faq.q4"];

  return (
    <Section>
      <PageHeader
        eyebrow={t("faq.eyebrow")}
        title={t("faq.title")}
        description={t("faq.body")}
      />
      <div className="mt-6 space-y-4">
        {faqKeys.map((key, index) => (
          <div key={key} className="surface rounded-3xl border border-border-1 p-5">
            <div className="text-sm font-semibold">{t(key)}</div>
            <div className="mt-2 text-sm text-muted-foreground">{t(`faq.a${index + 1}`)}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
