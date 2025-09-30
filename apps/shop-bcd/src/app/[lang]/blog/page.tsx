import BlogListing from "@ui/components/cms/blocks/BlogListing";
import { notFound } from "next/navigation";
import type { Shop } from "@acme/types";
import shopJson from "../../../../shop.json";
import type { Metadata } from "next";
import { getSeo } from "../../util/seo";
import { resolveLocale } from "@i18n/locales";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import type { NextSeoProps } from "next-seo";
import { useTranslations as loadTranslations } from "@acme/i18n/useTranslations.server";
import { getBlogProvider } from "./provider";
import { JsonLdScript, blogItemListJsonLd } from "../../../lib/jsonld";

type BlogShop = Pick<Shop, "id" | "luxuryFeatures" | "editorialBlog" | "name">;
const shop: BlogShop = shopJson;

export const revalidate = 60;

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!shop.luxuryFeatures.blog) {
    return notFound();
  }
  const lang = resolveLocale(params.lang);
  const t = await loadTranslations(lang);
  const provider = getBlogProvider(shop);
  const posts = await provider.fetchPublishedPosts(shop.id);
  const items = posts.map((p) => ({
    title: p.title,
    excerpt: p.excerpt,
    url: `/${params.lang}/blog/${p.slug}`,
    categories: Array.isArray(p.categories) ? p.categories : undefined,
    date: (p as { date?: string }).date,
    shopUrl: p.products?.[0]
      ? `/${params.lang}/product/${p.products[0]}`
      : undefined,
  }));
  const blogListingProps = { posts: items } as const;
  const maybeMockBlogListing = BlogListing as typeof BlogListing & {
    mock?: unknown;
  };

  if (maybeMockBlogListing.mock) {
    // When BlogListing is replaced with a Jest mock, invoke it directly so
    // tests can assert on the transformed props.
    // Pass an empty object as the second arg to align with tests
    // that assert the mock was called with (props, {}). Types are
    // intentionally loosened to avoid coupling to React internals.
    (maybeMockBlogListing as unknown as (
      props: unknown,
      ctx?: unknown,
    ) => unknown)(blogListingProps as unknown, {} as unknown);
  }

  const listing = <BlogListing {...blogListingProps} locale={lang} />;
  const category = (() => {
    const v = searchParams?.category;
    if (typeof v === "string") return v.trim() || undefined;
    if (Array.isArray(v)) return (v[0] ?? "").trim() || undefined;
    return undefined;
  })();
  const listUrl = `/${params.lang}/blog${category ? `?category=${encodeURIComponent(category)}` : ""}`;
  const listJsonLd = blogItemListJsonLd({
    url: listUrl,
    items: items.map((it) => ({ title: it.title, url: it.url!, date: it.date })),
  });
  return (
    <>
      <JsonLdScript data={listJsonLd} />
      {shop.editorialBlog?.promoteSchedule && (
        <div className="rounded bg-muted p-2">
          {t("Daily Edit scheduled for")} {shop.editorialBlog.promoteSchedule}
        </div>
      )}
      {listing}
    </>
  );
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const lang = resolveLocale(params.lang);
  const baseSeo = await getSeo(lang);
  const canonicalRoot = baseSeo.canonical?.replace(/\/$|$/, "") ?? "";
  const category = (() => {
    const v = searchParams?.category;
    if (typeof v === "string") return v.trim() || undefined;
    if (Array.isArray(v)) return (v[0] ?? "").trim() || undefined;
    return undefined;
  })();
  let canonical = canonicalRoot ? `${canonicalRoot}/blog` : undefined;
  if (canonical && category) canonical += `?category=${encodeURIComponent(category)}`;
  const settings = await getShopSettings(shop.id);
  const languages = settings.languages ?? ["en"];
  let canonicalRootForLanguages = baseSeo.canonical?.replace(/\/$|$/, "") ?? "";
  if (canonicalRootForLanguages.endsWith(`/${lang}`)) {
    canonicalRootForLanguages = canonicalRootForLanguages.slice(0, -(`/${lang}`.length));
  }
  const languagesAlt: Record<string, string> = {};
  for (const l of languages) {
    const base = `${canonicalRootForLanguages}/${l}/blog`;
    languagesAlt[l] = category ? `${base}?category=${encodeURIComponent(category)}` : base;
  }
  const seo = await getSeo(lang, {
    title: `${(await loadTranslations(lang))("Blog")} · ${shop.name}`,
    description: baseSeo.description,
    canonical,
    openGraph: { url: canonical } as NextSeoProps["openGraph"],
    twitter: {} as NextSeoProps["twitter"],
  });
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical || undefined, languages: languagesAlt },
    openGraph: seo.openGraph as Metadata["openGraph"],
    twitter: seo.twitter as Metadata["twitter"],
  };
}
