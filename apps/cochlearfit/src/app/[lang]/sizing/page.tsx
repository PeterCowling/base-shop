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
    title: t("sizing.meta.title"),
    description: t("sizing.meta.description"),
    path: "/sizing",
  });
}

export default async function SizingPage({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);

  const steps = ["sizing.step1", "sizing.step2", "sizing.step3"];
  const tips = ["sizing.tip1", "sizing.tip2", "sizing.tip3"];

  return (
    <Section>
      <PageHeader
        eyebrow={t("sizing.eyebrow")}
        title={t("sizing.title")}
        description={t("sizing.body")}
      />
      <div className="mt-6 space-y-4">
        <div className="surface rounded-3xl border border-border-1 p-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("sizing.stepsTitle")}
          </div>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            {steps.map((step) => (
              <li key={step}>{t(step)}</li>
            ))}
          </ol>
        </div>
        <div className="surface rounded-3xl border border-border-1 p-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("sizing.tipsTitle")}
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {tips.map((tip) => (
              <li key={tip}>{t(tip)}</li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
