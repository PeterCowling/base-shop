import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import type { AppLanguage } from "@/i18n.config";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

import { SUNSET_VIEWPOINTS_GUIDE_KEY } from "./constants";

type BreadcrumbOptions = {
  lang: AppLanguage;
  title: string;
  breadcrumbHomeLabel: string;
  breadcrumbGuidesLabel: string;
};

type BreadcrumbResult = {
  breadcrumb: BreadcrumbList;
  guidesHref: string;
};

export function buildBreadcrumb({
  lang,
  title,
  breadcrumbHomeLabel,
  breadcrumbGuidesLabel,
}: BreadcrumbOptions): BreadcrumbResult {
  const guidesSlug = getSlug("guides", lang);
  const guidesHref = `https://hostel-positano.com/${lang}/${guidesSlug}`;

  const breadcrumb: BreadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: breadcrumbHomeLabel,
        item: `https://hostel-positano.com/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: breadcrumbGuidesLabel,
        item: guidesHref,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${guidesHref}/${guideSlug(lang, SUNSET_VIEWPOINTS_GUIDE_KEY)}`,
      },
    ],
  } as const;

  return { breadcrumb, guidesHref };
}
