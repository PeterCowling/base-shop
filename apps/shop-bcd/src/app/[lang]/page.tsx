import type { PageComponent } from "@acme/types";
import { promises as fs } from "node:fs";
import path from "node:path";
import shop from "../../../shop.json";
import Home from "./page.client";
import { fetchPublishedPosts } from "@acme/sanity";

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
  let runtimeData: Record<string, Record<string, unknown>> | undefined;
  if (shop.enableEditorial) {
    const [post] = await fetchPublishedPosts(shop.id);
    if (post) {
      runtimeData = {
        BlogListing: {
          posts: [
            {
              title: post.title,
              excerpt: post.excerpt,
              url: `/${params.lang}/blog/${post.slug}`,
            },
          ],
        },
      };
    }
  }
  return (
    <Home components={components} locale={params.lang} runtimeData={runtimeData} />
  );
}
