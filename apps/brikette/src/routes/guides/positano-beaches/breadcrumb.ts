import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import type { TFunction } from "i18next";

import { resolveLocalizedString } from "./strings";

const HOME_BREADCRUMB_KEY = "labels.homeBreadcrumb" as const;
const GUIDES_BREADCRUMB_KEY = "labels.guidesBreadcrumb" as const;

export const createBreadcrumb = ({
  lang,
  pathname,
  title,
  translate,
  fallbackTranslate,
}: {
  lang: string;
  pathname: string;
  title: string;
  translate: TFunction<"guides">;
  fallbackTranslate: TFunction<"guides">;
}): BreadcrumbList => {
  const homeLabelRaw = translate(HOME_BREADCRUMB_KEY);
  const guidesLabelRaw = translate(GUIDES_BREADCRUMB_KEY);
  const homeLabelFallback = fallbackTranslate(HOME_BREADCRUMB_KEY) as string;
  const guidesLabelFallback = fallbackTranslate(GUIDES_BREADCRUMB_KEY) as string;

  const homeLabel = resolveLocalizedString(homeLabelRaw, homeLabelFallback, HOME_BREADCRUMB_KEY);
  const guidesLabel = resolveLocalizedString(
    guidesLabelRaw,
    guidesLabelFallback,
    GUIDES_BREADCRUMB_KEY
  );

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeLabel, item: `https://hostel-positano.com/${lang}` },
      {
        "@type": "ListItem",
        position: 2,
        name: guidesLabel,
        item: `https://hostel-positano.com/${lang}/guides`,
      },
      { "@type": "ListItem", position: 3, name: title, item: `https://hostel-positano.com${pathname}` },
    ],
  } as const;
};
