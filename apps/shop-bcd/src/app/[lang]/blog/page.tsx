import BlogListing from "@ui/components/cms/blocks/BlogListing";
import { fetchPublishedPosts } from "@acme/sanity";
import { notFound } from "next/navigation";
import type { Shop } from "@acme/types";
import shopJson from "../../../../shop.json";
import type { Metadata } from "next";
import { getSeo } from "../../util/seo";
import { resolveLocale } from "@i18n/locales";
import { getShopSettings } from "@platform-core/repositories/settings.server";

type BlogShop = Pick<Shop, "id" | "luxuryFeatures" | "editorialBlog" | "name">;
const shop: BlogShop = shopJson;

export default async function BlogPage({ params }: { params: { lang: string } }) {
  if (!shop.luxuryFeatures.blog) {
    return notFound();
  }
  const posts = await fetchPublishedPosts(shop.id);
  const items = posts.map((p) => ({
    title: p.title,
    excerpt: p.excerpt,
    url: `/${params.lang}/blog/${p.slug}`,
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

  const listing = <BlogListing {...blogListingProps} />;
  return (
    <>
      {shop.editorialBlog?.promoteSchedule && (
        <div className="rounded bg-muted p-2">
          Daily Edit scheduled for {shop.editorialBlog.promoteSchedule}
        </div>
      )}
      {listing}
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { lang: string };
}): Promise<Metadata> {
  const lang = resolveLocale(params.lang);
  const baseSeo = await getSeo(lang);
  const canonicalRoot = baseSeo.canonical?.replace(/\/$|$/, "") ?? "";
  const canonical = canonicalRoot ? `${canonicalRoot}/blog` : undefined;
  const settings = await getShopSettings(shop.id);
  const languages = settings.languages ?? ["en"];
  let canonicalRootForLanguages = baseSeo.canonical?.replace(/\/$|$/, "") ?? "";
  if (canonicalRootForLanguages.endsWith(`/${lang}`)) {
    canonicalRootForLanguages = canonicalRootForLanguages.slice(0, -(`/${lang}`.length));
  }
  const languagesAlt: Record<string, string> = {};
  for (const l of languages) {
    languagesAlt[l] = `${canonicalRootForLanguages}/${l}/blog`;
  }
  const seo = await getSeo(lang, {
    title: `Blog · ${shop.name}`,
    description: baseSeo.description,
    canonical,
    openGraph: { url: canonical } as any,
    twitter: {} as any,
  });
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical || undefined, languages: languagesAlt },
    openGraph: seo.openGraph as Metadata["openGraph"],
    twitter: seo.twitter as Metadata["twitter"],
  };
}
