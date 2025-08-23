import type { PageComponent } from "@acme/types";
import { promises as fs } from "fs";
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
      "..",
      "..",
      "data",
      "shops",
      shop.id,
      "pages",
      "home.json"
    );
    const json = await fs.readFile(file, "utf8");
    const data = JSON.parse(json);
    return Array.isArray(data) ? (data as PageComponent[]) : (data.components ?? []);
  } catch {
    return [];
  }
}

export default async function Page({
  params,
}: {
  params: { lang: string };
}) {
  const components = await loadComponents();
  let latestPost: BlogPost | undefined;
  if (
    shop.luxuryFeatures?.contentMerchandising &&
    shop.luxuryFeatures?.blog
  ) {
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
  }
  const lang: Locale = resolveLocale(params.lang);
  return <Home components={components} locale={lang} latestPost={latestPost} />;
}
