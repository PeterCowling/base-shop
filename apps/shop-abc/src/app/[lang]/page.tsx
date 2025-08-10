import type { PageComponent } from "@types";
import { getPages } from "@platform-core/repositories/pages/index.server";
import shop from "../../../shop.json";
import Home from "./page.client";
import { trackPageView } from "@platform-core/analytics";

async function loadComponents(): Promise<PageComponent[]> {
  const pages = await getPages(shop.id);
  return pages.find((p) => p.slug === "home")?.components ?? [];
}

export default async function Page({
  params,
}: {
  params: { lang: string };
}) {
  const components = await loadComponents();
  await trackPageView(shop.id, "home");
  return <Home components={components} locale={params.lang} />;
}
