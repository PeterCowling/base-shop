// src/routes/guides/cheapEatsInPositano/createBreadcrumb.ts
import type { CheapEatsMetaData } from "./constants";
import { normalizeText } from "./normalizeText";
import type { CheapEatsTranslationContext } from "./useCheapEatsTranslationContext";

type CreateBreadcrumbParams = {
  context: CheapEatsTranslationContext;
  title: string;
};

export function createBreadcrumb({ context, title }: CreateBreadcrumbParams): CheapEatsMetaData["breadcrumb"] {
  const { lang, pathname, t, normalizeEnglish } = context;

  const ensureBreadcrumbLabel = (
    candidates: Array<string | undefined>,
    fallback: string,
  ): string => {
    for (const value of candidates) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
    }
    return fallback;
  };

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: ensureBreadcrumbLabel(
          [
            normalizeText(t("breadcrumbs.home"), "breadcrumbs.home"),
            normalizeText(t("labels.homeBreadcrumb"), "labels.homeBreadcrumb"),
            normalizeEnglish("breadcrumbs.home"),
            normalizeEnglish("labels.homeBreadcrumb"),
          ],
          "Home",
        ),
        item: `https://hostel-positano.com/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: ensureBreadcrumbLabel(
          [
            normalizeText(t("breadcrumbs.guides"), "breadcrumbs.guides"),
            normalizeText(t("labels.guidesBreadcrumb"), "labels.guidesBreadcrumb"),
            normalizeEnglish("breadcrumbs.guides"),
            normalizeEnglish("labels.guidesBreadcrumb"),
          ],
          "Guides",
        ),
        item: `https://hostel-positano.com/${lang}/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `https://hostel-positano.com${pathname}`,
      },
    ],
  };
}
