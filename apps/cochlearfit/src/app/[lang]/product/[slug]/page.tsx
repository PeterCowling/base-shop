import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailBoundary from "@/components/ProductDetailBoundary";
import { LOCALES, resolveLocale } from "@/lib/locales";
import { createTranslator, loadMessages } from "@/lib/messages";
import { buildMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { withLocale } from "@/lib/routes";
import {
  getCochlearfitProductBySlug,
  listCochlearfitProductSlugs,
} from "@/lib/cochlearfitCatalog.server";

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await listCochlearfitProductSlugs();
  return LOCALES.flatMap((lang) =>
    slugs.map((slug) => ({ lang, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang?: string | string[]; slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);
  const slug = resolved?.slug ?? "";
  const product = await getCochlearfitProductBySlug(locale, slug);

  if (!product) {
    return buildMetadata({
      locale,
      title: t("product.meta.fallbackTitle"),
      description: t("product.meta.fallbackDescription"),
      path: `/product/${slug}`,
    });
  }

  const name = t(product.name);
  const description = t(product.shortDescription);
  const ogImage = `${SITE_URL}${product.images[0]?.src ?? "/images/og-home.svg"}`;
  const nameVars = { name };

  return buildMetadata({
    locale,
    title: t("product.meta.title", nameVars),
    description,
    path: `/product/${product.slug}`,
    openGraph: {
      title: t("product.meta.title", nameVars),
      description,
      url: new URL(withLocale(`/product/${product.slug}`, locale), SITE_URL).toString(),
      type: "website",
      image: {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: t(product.images[0]?.alt ?? "home.meta.ogAlt"),
      },
    },
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; lang?: string | string[] }>;
}) {
  const resolved = await params;
  const slug = resolved?.slug ?? "";
  const locale = resolveLocale(resolved?.lang);
  const product = await getCochlearfitProductBySlug(locale, slug);
  if (!product) {
    notFound();
  }

  return <ProductDetailBoundary product={product} />;
}
