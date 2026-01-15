import type { Metadata } from "next";
import Section from "@/components/Section";
import PageHeader from "@/components/PageHeader";
import CheckoutPanel from "@/components/checkout/CheckoutPanel";
import { listCochlearfitProducts } from "@/lib/cochlearfitCatalog.server";
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
    title: t("checkout.meta.title"),
    description: t("checkout.meta.description"),
    path: "/checkout",
  });
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);
  const products = await listCochlearfitProducts(locale);

  return (
    <Section>
      <PageHeader
        eyebrow={t("checkout.eyebrow")}
        title={t("checkout.title")}
        description={t("checkout.body")}
      />
      <div className="mt-6">
        <CheckoutPanel products={products} />
      </div>
    </Section>
  );
}
