// apps/cover-me-pretty/src/app/[lang]/product/[slug]/page.tsx

import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

import BlogListing, { type BlogPost } from "@acme/cms-ui/blocks/BlogListing";
import { LOCALES } from "@acme/i18n";
import { resolveLocale } from "@acme/i18n/locales";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { getShopSkuBySlug, listShopSkus } from "@acme/platform-core/repositories/catalogSkus.server";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import { getReturnLogistics } from "@acme/platform-core/returnLogistics";
import { fetchPublishedPosts } from "@acme/sanity";
import type { Locale,SKU } from "@acme/types";

import shop from "../../../../../shop.json";
import { JsonLdScript, productJsonLd } from "../../../../lib/jsonld";
import { getSeo } from "../../../util/seo";

import PdpClient from "./PdpClient.client";

async function getProduct(
  slug: string,
  lang: Locale,
  preview: boolean
): Promise<SKU | null> {
  return await getShopSkuBySlug(shop.id, slug, lang, { includeDraft: preview });
}

export async function generateStaticParams() {
  const resolved = await listShopSkus(shop.id, "en", { includeDraft: false }).catch(
    () => [] as SKU[],
  );
  const unique = Array.from(new Set(resolved.map((s) => s.slug))).filter(Boolean);
  return LOCALES.flatMap((lang) => unique.map((slug) => ({ lang, slug })));
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
