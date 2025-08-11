import type { PageComponent } from "@types";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { readShop } from "@platform-core/repositories/shops.server";
import Home from "./page.client";
import { trackPageView } from "@platform-core/analytics";
import { env } from "@acme/config";

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
  await trackPageView(shop.id, "home");
  return <Home components={components} locale={params.lang} />;
}
