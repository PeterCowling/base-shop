// src/routes/guides/how-to-get-to-positano.breadcrumb.ts
import { BASE_URL } from "@/config/site";
import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import { guideNamespace, guideSlug } from "@/routes.guides-helpers";

import { GUIDE_KEY } from "./how-to-get-to-positano.constants";
import { safeString } from "./how-to-get-to-positano.normalizers";
import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { getGuidesTranslator, getHeaderTranslator } from "./how-to-get-to-positano.translators";

export function buildBreadcrumb(context: GuideSeoTemplateContext): BreadcrumbList {
  const header = getHeaderTranslator(context.lang);
  const headerFallback = getHeaderTranslator("en");
  const guides = getGuidesTranslator(context.lang);
  const guidesFallback = getGuidesTranslator("en");

  const homeLabel = safeString(header("home"), safeString(headerFallback("home"), "Home"));
  const guidesLabel = safeString(
    guides("labels.guidesBreadcrumb"),
    safeString(guidesFallback("labels.guidesBreadcrumb"), "Guides"),
  );
  const pageLabel = safeString(
    guides(`labels.${GUIDE_KEY}Breadcrumb`),
    context.article.title,
  );

  const { baseSlug } = guideNamespace(context.lang, context.guideKey);
  const pageSlug = guideSlug(context.lang, context.guideKey);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeLabel, item: `${BASE_URL}/${context.lang}` },
      {
        "@type": "ListItem",
        position: 2,
        name: guidesLabel,
        item: `${BASE_URL}/${context.lang}/${baseSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: pageLabel,
        item: `${BASE_URL}/${context.lang}/${baseSlug}/${pageSlug}`,
      },
    ],
  } satisfies BreadcrumbList;
}
