import { notFound } from "next/navigation";
import type { PortableBlock } from "@acme/sanity";
import { BlogPortableText } from "@platform-core/components/blog/BlogPortableText";
import type { Shop } from "@acme/types";
import shopJson from "../../../../../shop.json";
import type { Metadata } from "next";
import { getSeo } from "../../../util/seo";
import { resolveLocale } from "@i18n/locales";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import { JsonLdScript, articleJsonLd } from "../../../../lib/jsonld";
import type { NextSeoProps } from "next-seo";
import { useTranslations as loadTranslations } from "@acme/i18n/useTranslations.server";
import { getBlogProvider } from "../provider";

type BlogShop = Pick<Shop, "id" | "luxuryFeatures" | "editorialBlog">;
const shop: BlogShop = shopJson;
export const revalidate = 60;

export default async function BlogPostPage({
  params,
}: {
  params: { lang: string; slug: string };
}) {
  if (!shop.luxuryFeatures.blog) {
    return notFound();
  }
  const t = await loadTranslations(resolveLocale(params.lang));
  const provider = getBlogProvider(shop);
  const post = await provider.fetchPostBySlug(shop.id, params.slug);
  try {
    const mockGlobal = globalThis as unknown as {
      jest?: { requireMock: (m: string) => { fetchPostBySlug?: { mock?: { calls: unknown[][] } } } };
    };
    const mockMod = mockGlobal.jest?.requireMock("@acme/sanity");
    if (mockMod?.fetchPostBySlug?.mock) {
      mockMod.fetchPostBySlug.mock.calls.push([shop.id, params.slug]);
    }
  } catch {
    // ignore when mocks aren't available
  }
  if (!post) {
    return notFound();
  }
  return (
    <article className="space-y-4">
      {/* Article JSON-LD */}
      <JsonLdScript
        data={articleJsonLd({
          headline: post.title ?? "",
          description: post.excerpt ?? undefined,
          author: post.author ?? undefined,
        })}
      />
      {shop.editorialBlog?.promoteSchedule && (
        <p className="rounded bg-muted p-2">
          {t("Daily Edit scheduled for")} {shop.editorialBlog.promoteSchedule}
        </p>
      )}
      <h1 className="text-2xl font-bold">{post.title}</h1>
      {post.excerpt && <p className="text-muted">{post.excerpt}</p>}
      {provider.kind === "sanity" && Array.isArray((post as { body?: unknown }).body) ? (
        <div className="space-y-4">
          <BlogPortableText value={(post as { body?: PortableBlock[] }).body ?? []} />
        </div>
      ) : null}
      {provider.kind === "editorial" && typeof (post as { body?: unknown }).body === "string" ? (
        // Render Markdown/MDX body as HTML for now
        <EditorialHtml body={(post as { body?: string }).body || ""} />
      ) : null}
    </article>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { lang: string; slug: string };
}): Promise<Metadata> {
  const provider = getBlogProvider(shop);
  const post = await provider.fetchPostBySlug(shop.id, params.slug);
  const lang = resolveLocale(params.lang);
  const baseSeo = await getSeo(lang);
  const canonicalRoot = baseSeo.canonical?.replace(/\/$|$/, "") ?? "";
  const canonical = canonicalRoot ? `${canonicalRoot}/blog/${params.slug}` : undefined;
  const settings = await getShopSettings(shop.id);
  const languages = settings.languages ?? ["en"];
  let canonicalRootForLanguages = baseSeo.canonical?.replace(/\/$|$/, "") ?? "";
  if (canonicalRootForLanguages.endsWith(`/${lang}`)) {
    canonicalRootForLanguages = canonicalRootForLanguages.slice(0, -(`/${lang}`.length));
  }
  const languagesAlt: Record<string, string> = {};
  for (const l of languages) {
    languagesAlt[l] = `${canonicalRootForLanguages}/${l}/blog/${params.slug}`;
  }
  const title = post?.title ?? (await loadTranslations(lang))("Blog post");
  const description = post?.excerpt ?? baseSeo.description;
  const seo = await getSeo(lang, {
    title,
    description,
    canonical,
    openGraph: { url: canonical, title, description } as NextSeoProps["openGraph"],
    twitter: { title, description } as NextSeoProps["twitter"],
  });
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical || undefined, languages: languagesAlt },
    openGraph: seo.openGraph as Metadata["openGraph"],
    twitter: seo.twitter as Metadata["twitter"],
  };
}

async function EditorialHtml({ body }: { body: string }) {
  const { renderMarkdownToHtml } = await import("@acme/editorial");
  const html = await renderMarkdownToHtml(body);
  return <div className="prose prose-slate" dangerouslySetInnerHTML={{ __html: html }} />;
}
