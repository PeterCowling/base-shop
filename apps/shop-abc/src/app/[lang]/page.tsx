import type { PageComponent } from "@types";
import { getPages } from "@platform-core/repositories/pages/index.server";
import shop from "../../../shop.json";
import Home from "./page.client";
import { Locale, resolveLocale } from "@i18n/locales";

async function loadComponents(): Promise<PageComponent[]> {
  const pages = await getPages(shop.id);
  return pages.find((p) => p.slug === "home")?.components ?? [];
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: raw } = await params;
  const locale: Locale = resolveLocale(raw);
  const components = await loadComponents();
  return <Home components={components} locale={locale} />;
}
