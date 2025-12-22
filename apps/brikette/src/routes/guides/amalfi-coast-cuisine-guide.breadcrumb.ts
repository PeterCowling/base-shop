// src/routes/guides/amalfi-coast-cuisine-guide.breadcrumb.ts
import type { TFunction } from "i18next";

import { getSlug } from "@/utils/slug";
import type { AppLanguage } from "@/i18n.config";

import type { CuisineBreadcrumb } from "./amalfi-coast-cuisine-guide.constants";

function resolveLabel(value: unknown, fallback: string, translationKey: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === translationKey) {
    return fallback;
  }
  return trimmed;
}

export function createCuisineBreadcrumb(context: {
  lang: AppLanguage;
  pathname: string;
  title: string;
  translator: TFunction<"guides">;
  englishTranslator: TFunction<"guides">;
}): CuisineBreadcrumb {
  const englishHome = context.englishTranslator("labels.homeBreadcrumb", { defaultValue: "Home" });
  const englishGuides = context.englishTranslator("labels.guidesBreadcrumb", { defaultValue: "Guides" });

  const homeLabel = resolveLabel(
    context.translator("labels.homeBreadcrumb"),
    typeof englishHome === "string" ? englishHome : "Home",
    "labels.homeBreadcrumb",
  );
  const guidesLabel = resolveLabel(
    context.translator("labels.guidesBreadcrumb"),
    typeof englishGuides === "string" ? englishGuides : "Guides",
    "labels.guidesBreadcrumb",
  );

  const guidesSlug = getSlug("guides", context.lang);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: homeLabel,
        item: `https://hostel-positano.com/${context.lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: guidesLabel,
        item: `https://hostel-positano.com/${context.lang}/${guidesSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: context.title,
        item: `https://hostel-positano.com${context.pathname}`,
      },
    ],
  } as const;
}
