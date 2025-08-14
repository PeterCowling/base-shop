import type { PageComponent } from "@acme/types";
import { promises as fs } from "node:fs";
import path from "node:path";
import shop from "../../../shop.json";
import Home from "./page.client";
import { fetchPublishedPosts } from "@acme/sanity";
import type { BlogPost } from "@ui/components/cms/blocks/BlogListing";

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
  if (shop.editorialBlog?.enabled) {
    const posts = await fetchPublishedPosts(shop.id);
    const first = posts[0];
    if (first) {
      latestPost = {
        title: first.title,
        excerpt: first.excerpt,
        url: `/${params.lang}/blog/${first.slug}`,
      };
    }
  }
  return <Home components={components} locale={params.lang} latestPost={latestPost} />;
}
