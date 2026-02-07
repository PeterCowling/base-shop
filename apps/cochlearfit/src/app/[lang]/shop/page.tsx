import type { Metadata } from "next";

import PageHeader from "@/components/PageHeader";
import ProductGrid from "@/components/ProductGrid";
import Section from "@/components/Section";
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
    title: t("shop.meta.title"),
    description: t("shop.meta.description"),
    path: "/shop",
  });
}

export default async function ShopPage({
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
        eyebrow={t("shop.eyebrow")}
        title={t("shop.title")}
        description={t("shop.body")}
      />
      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
    </Section>
  );
}
