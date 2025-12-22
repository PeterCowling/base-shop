import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import { BASE_URL } from "@/config/site";
import appI18n from "@/i18n";
import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import { getSlug } from "@/utils/slug";

export function buildBreadcrumb(context: GuideSeoTemplateContext): BreadcrumbList {
  const headerLocal = appI18n.getFixedT(context.lang, "header");
  const headerEn = appI18n.getFixedT("en", "header");
  const homeLabel = headerLocal("home", { defaultValue: headerEn("home") });
  const howToLabel = headerLocal("howToGetHere", { defaultValue: headerEn("howToGetHere") });
  const howToSlug = getSlug("howToGetHere", context.lang);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeLabel, item: `${BASE_URL}/${context.lang}` },
      {
        "@type": "ListItem",
        position: 2,
        name: howToLabel,
        item: `${BASE_URL}/${context.lang}/${howToSlug}`,
      },
      { "@type": "ListItem", position: 3, name: context.article.title, item: context.canonicalUrl },
    ],
  } satisfies BreadcrumbList;
}
