import { notFound } from "next/navigation";
import type { PageComponent } from "@types";
import type { Locale } from "@/i18n/locales";
import { getPages } from "@platform-core/repositories/pages/index.server";
import DynamicRenderer from "@ui";
import shop from "../../../../shop.json";

async function loadComponents(slug: string): Promise<PageComponent[] | null> {
  const pages = await getPages(shop.id);
  const page = pages.find((p) => p.slug === slug && p.status === "published");
  return page?.components ?? null;
}

export default async function Page({
  params,
}: {
  params: { lang: Locale; slug: string[] };
}) {
  const slug = params.slug.join("/");
  const components = await loadComponents(slug);
  if (!components) notFound();
  return <DynamicRenderer components={components} locale={params.lang} />;
}

