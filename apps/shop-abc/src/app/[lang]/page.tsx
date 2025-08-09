import type { PageComponent } from "@types";
import { getPages } from "@platform-core/repositories/pages/index.server";
import type { Locale } from "@i18n/locales";
import shop from "../../../shop.json";
import Home from "./page.client";

async function loadComponents(): Promise<PageComponent[]> {
  const pages = await getPages(shop.id);
  return pages.find((p) => p.slug === "home")?.components ?? [];
}

export default async function Page({
  params,
}: {
  params: { lang: Locale };
}) {
  const components = await loadComponents();
  return <Home components={components} locale={params.lang} />;
}
