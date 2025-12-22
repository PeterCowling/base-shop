import { Suspense } from "react";
import type { Metadata } from "next";
import Section from "@/components/Section";
import PageHeader from "@/components/PageHeader";
import ThankYouPanel from "@/components/checkout/ThankYouPanel";
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
    title: t("thankyou.meta.title"),
    description: t("thankyou.meta.description"),
    path: "/thank-you",
  });
}

export default async function ThankYouPage({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);

  return (
    <Section>
      <PageHeader
        eyebrow={t("thankyou.eyebrow")}
        title={t("thankyou.title")}
        description={t("thankyou.body")}
      />
      <div className="mt-6">
        <Suspense
          fallback={
            <div className="surface animate-fade-up rounded-3xl border border-border-1 p-6 text-center">
              <div className="text-sm text-muted-foreground">
                {t("thankyou.loading") as string}
              </div>
            </div>
          }
        >
          <ThankYouPanel />
        </Suspense>
      </div>
    </Section>
  );
}
