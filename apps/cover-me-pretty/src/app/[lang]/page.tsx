import type { PageComponent } from "@acme/page-builder-core";
import { promises as fs } from "node:fs";
import path from "path";
import shop from "../../../shop.json";
import Home from "./page.client";
import { fetchPublishedPosts } from "@acme/sanity";
import type { BlogPost } from "@ui/components/cms/blocks/BlogListing";
import { Locale, resolveLocale } from "@i18n/locales";

async function loadComponents(): Promise<PageComponent[]> {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "shops",
      shop.id,
      "pages",
      "home.json"
    );
    // The file path is constructed from trusted config (shop.id) and static segments.
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-1234: Path is derived from vetted configuration, not user input.
    const json = await fs.readFile(file, "utf8");
    const data = JSON.parse(json);
    return Array.isArray(data)
      ? (data as PageComponent[])
      : (data.components ?? []);
  } catch {
    return [];
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const components = await loadComponents();
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);

  let latestPost: BlogPost | undefined;
  if (shop.luxuryFeatures?.contentMerchandising && shop.luxuryFeatures?.blog) {
    const posts = await fetchPublishedPosts(shop.id);
    const first = posts[0];
    if (first) {
      latestPost = {
        title: first.title,
        excerpt: first.excerpt,
        url: `/${lang}/blog/${first.slug}`,
        shopUrl: first.products?.[0]
          ? `/${lang}/product/${first.products[0]}`
          : undefined,
      };
    }
  }

  return <Home components={components} locale={lang} latestPost={latestPost} />;
}
