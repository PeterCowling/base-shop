import type { Metadata } from "next";

import PageHeader from "@/components/PageHeader";
import TermsOfSaleEuContent from "@/components/policies/terms-sale-eu/TermsOfSaleEuContent";
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
    title: t("termsSale.meta.title"),
    description: t("termsSale.meta.description"),
    path: "/policies/terms-sale-eu",
  });
}

export default async function TermsOfSaleEuPolicyPage({
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
        eyebrow={t("termsSale.page.eyebrow")}
        title={t("termsSale.page.title")}
        description={t("termsSale.page.description")}
      />
      <div className="mt-6">
        <TermsOfSaleEuContent locale={locale} t={t} />
      </div>
    </Section>
  );
}
