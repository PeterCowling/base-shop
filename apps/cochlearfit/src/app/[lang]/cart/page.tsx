import type { Metadata } from "next";

import CartContents from "@/components/cart/CartContents";
import PageHeader from "@/components/PageHeader";
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
    title: t("cart.meta.title"),
    description: t("cart.meta.description"),
    path: "/cart",
  });
}

export default async function CartPage({
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
        eyebrow={t("cart.eyebrow")}
        title={t("cart.title")}
        description={t("cart.body")}
      />
      <div className="mt-6">
        <CartContents products={products} />
      </div>
    </Section>
  );
}
