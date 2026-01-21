// src/routes/guides/luggage-storage-positano.breadcrumb.ts
import type { TFunction } from "i18next";

import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";

import { resolveLuggageStorageString } from "./luggage-storage-positano.strings";

interface CreateBreadcrumbOptions {
  lang: string;
  pathname: string;
  title: string;
  translator: TFunction<"guides">;
  englishTranslator: TFunction<"guides">;
}

export function createLuggageStorageBreadcrumb({
  lang,
  pathname,
  title,
  translator,
  englishTranslator,
}: CreateBreadcrumbOptions): BreadcrumbList {
  const englishHome = englishTranslator("labels.homeBreadcrumb") as string;
  const englishGuides = englishTranslator("labels.guidesBreadcrumb") as string;

  const homeBreadcrumb =
    resolveLuggageStorageString(
      translator("labels.homeBreadcrumb"),
      "labels.homeBreadcrumb",
      englishHome,
      englishHome,
    ) ?? englishHome;

  const guidesBreadcrumb =
    resolveLuggageStorageString(
      translator("labels.guidesBreadcrumb"),
      "labels.guidesBreadcrumb",
      englishGuides,
      englishGuides,
    ) ?? englishGuides;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: homeBreadcrumb,
        item: `https://hostel-positano.com/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: guidesBreadcrumb,
        item: `https://hostel-positano.com/${lang}/guides`,
      },
      { "@type": "ListItem", position: 3, name: title, item: `https://hostel-positano.com${pathname}` },
    ],
  } as const;
}
