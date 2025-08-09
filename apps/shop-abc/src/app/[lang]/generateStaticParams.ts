// apps/shop-abc/src/app/[lang]/generateStaticParams.ts
import { LOCALES } from "@acme/i18n";
import { getPages } from "@platform-core/repositories/pages/index.server";
import shop from "../../../shop.json";

export default async function generateStaticParams() {
  const pages = await getPages(shop.id);
  const published = pages.filter((p) => p.status === "published");

  const params: { lang: string; slug?: string[] }[] = [];

  for (const lang of LOCALES) {
    params.push({ lang });
    for (const page of published) {
      if (page.slug === "home") continue;
      params.push({ lang, slug: page.slug.split("/") });
    }
  }

  return params;
}

