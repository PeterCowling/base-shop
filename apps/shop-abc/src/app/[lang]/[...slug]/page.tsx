import { notFound } from "next/navigation";
import type { PageComponent } from "@types";
import { getPages } from "@platform-core/repositories/pages/index.server";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import shop from "../../../../shop.json";
import { Locale, resolveLocale } from "@/i18n/locales";

async function loadComponents(slug: string): Promise<PageComponent[] | null> {
  const pages = await getPages(shop.id);
  const page = pages.find((p) => p.slug === slug && p.status === "published");
  return page?.components ?? null;
}

export default async function Page({
  params,
}: {
  params: { lang: string; slug: string[] };
}) {
  const slug = params.slug.join("/");
  const components = await loadComponents(slug);
  if (!components) notFound();
  const locale: Locale = resolveLocale(params.lang);
  return <DynamicRenderer components={components} locale={locale} />;
}

