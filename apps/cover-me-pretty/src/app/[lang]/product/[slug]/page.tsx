// apps/cover-me-pretty/src/app/[lang]/product/[slug]/page.tsx

import { LOCALES } from "@acme/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import BlogListing, { type BlogPost } from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import shop from "../../../../../shop.json";
import PdpClient from "./PdpClient.client";
import { readRepo } from "@platform-core/repositories/json.server";
import type { SKU, ProductPublication, Locale } from "@acme/types";
import { resolveLocale } from "@i18n/locales";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import { getSeo } from "../../../util/seo";
import { JsonLdScript, productJsonLd } from "../../../../lib/jsonld";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

async function getProduct(
  slug: string,
  lang: Locale,
  preview: boolean
): Promise<SKU | null> {
  const catalogue = await readRepo<ProductPublication>(shop.id);
  const record = catalogue.find((p) => p.sku === slug || p.id === slug);
  if (!record) return null;
  if (!preview && record.status !== "active") return null;
  const title =
    record.title[lang] ?? record.title.en ?? Object.values(record.title)[0] ?? "";
  const description =
    record.description[lang] ??
    record.description.en ??
    Object.values(record.description)[0] ??
    "";
  return {
    id: record.id,
    slug: record.sku ?? record.id,
    title,
    price: record.price,
    deposit: record.deposit ?? 0,
    stock: 0,
    forSale: record.forSale ?? true,
    forRental: record.forRental ?? false,
    dailyRate: record.dailyRate,
    weeklyRate: record.weeklyRate,
    monthlyRate: record.monthlyRate,
    availability: record.availability ?? [],
    media: record.media ?? [],
    sizes: [],
    description,
  };
}

export async function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    ["green-sneaker", "sand-sneaker", "black-sneaker"].map((slug) => ({
      lang,
      slug,
    }))
  );
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string; lang: string };
}): Promise<Metadata> {
  const lang = resolveLocale(params.lang);

  try {
    const product = await getProduct(params.slug, lang, false);
    const settings = await getShopSettings(shop.id);
    const baseSeo = await getSeo(lang);

    if (!product) {
      const t = await getTranslations(lang);
      return { title: t("product.notFound") };
    }

    const truncate = (text: string, len = 160) =>
      text.length > len ? `${text.slice(0, len - 1)}…` : text;
    const description = truncate(product.description);

    const canonicalRoot = baseSeo.canonical?.replace(/\/$|$/, "") ?? "";
    const canonical = canonicalRoot
      ? `${canonicalRoot}/product/${product.slug}`
      : undefined;
    const image = product.media?.[0]?.url;

    const seo = await getSeo(lang, {
      title: product.title,
      description,
      canonical,
      openGraph: {
        url: canonical,
        title: product.title,
        description,
        images: image ? [{ url: image }] : undefined,
      },
      twitter: {
        cardType: image ? "summary_large_image" : "summary",
      },
    });
    // Build hreflang alternates for this product path
    const languages = settings.languages ?? ["en"];
    let canonicalRootForLanguages =
      baseSeo.canonical?.replace(/\/$|$/, "") ?? "";
    if (canonicalRootForLanguages.endsWith(`/${lang}`)) {
      canonicalRootForLanguages = canonicalRootForLanguages.slice(
        0,
        -(`/${lang}`.length),
      );
    }
    const languagesAlt: Record<string, string> = {};
    if (canonicalRootForLanguages) {
      for (const l of languages) {
        languagesAlt[l] = `${canonicalRootForLanguages}/${l}/product/${product.slug}`;
      }
    }
    return {
      title: seo.title,
      description: seo.description,
      alternates: {
        canonical: seo.canonical || undefined,
        languages: languagesAlt,
      },
      openGraph: seo.openGraph as Metadata["openGraph"],
      twitter: seo.twitter as Metadata["twitter"],
    };
  } catch {
    // Fallback metadata when SEO/settings resolution fails
    return {
      title: params.slug, // i18n-exempt -- SEO-1234 [ttl=2025-12-31] LHCI fallback title for product
    };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string; lang: string };
}) {
  const { isEnabled } = await draftMode();
  const t = await getTranslations(resolveLocale(params.lang));
  const product = await getProduct(
    params.slug,
    params.lang as Locale,
    isEnabled
  );
  if (!product) return notFound();

  let latestPost: BlogPost | undefined;
  if (shop.luxuryFeatures.contentMerchandising && shop.luxuryFeatures.blog) {
    try {
      const posts = await fetchPublishedPosts(shop.id);
      const first = posts[0];
      if (first) {
        latestPost = {
          title: first.title,
          excerpt: first.excerpt,
          url: `/${params.lang}/blog/${first.slug}`,
          shopUrl: first.products?.[0]
            ? `/${params.lang}/product/${first.products[0]}`
            : undefined,
        };
      }
    } catch {
      /* ignore failed blog fetch */
    }
  }

  let cfg: { requireTags?: boolean; allowWear?: boolean } = {};
  try {
    cfg = await getReturnLogistics();
  } catch {
    cfg = { requireTags: false, allowWear: true };
  }
  const settings = await getShopSettings(shop.id);
  return (
    <>
      {/* Product JSON-LD */}
      <JsonLdScript
        data={productJsonLd({
          name: product.title,
          description: product.description,
          image: product.media?.[0]?.url,
          price: product.price,
          priceCurrency: settings.currency ?? "EUR",
          sku: product.slug,
        })}
      />
      {latestPost && <BlogListing posts={[latestPost]} />}
      <PdpClient product={product} />
      <div className="p-6 space-y-1 text-sm text-gray-600">
        {cfg.requireTags && (
          <p>{t("returns.requireTags")}</p>
        )}
        {cfg.allowWear === false && (
          <p>{t("returns.noWear")}</p>
        )}
      </div>
    </>
  );
}
