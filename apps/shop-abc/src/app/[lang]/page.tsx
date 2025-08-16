import type { PageComponent } from "@acme/types";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { readShop } from "@platform-core/repositories/shops.server";
import Home from "./page.client";
import { trackPageView } from "@platform-core/analytics";
import { env } from "@acme/config";
import { fetchPublishedPosts } from "@acme/sanity";
import type { BlogPost } from "@ui/components/cms/blocks/BlogListing";

async function loadComponents(shopId: string): Promise<PageComponent[]> {
  const pages = await getPages(shopId);
  return pages.find((p) => p.slug === "home")?.components ?? [];
}

export default async function Page({
  params,
}: {
  params: { lang: string };
}) {
  const shop = await readShop(env.NEXT_PUBLIC_SHOP_ID || "shop-abc");
  const components = await loadComponents(shop.id);
  let latestPost: BlogPost | undefined;
  if (shop.luxuryFeatures?.blog && shop.editorialBlog?.enabled) {
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
  await trackPageView(shop.id, "home");
  return <Home components={components} locale={params.lang} latestPost={latestPost} />;
}
