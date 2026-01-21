// src/routes/guides/guide-seo/useGuideBreadcrumb.ts
import { useMemo } from "react";

import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";

import type { GuideSeoTemplateContext } from "./types";
import { useDefaultBreadcrumb } from "./useDefaultBreadcrumb";

export function useGuideBreadcrumb(params: {
  lang: AppLanguage;
  guideKey: GuideKey;
  title: string;
  homeLabel: string;
  guidesLabel: string;
  buildBreadcrumb?: (ctx: GuideSeoTemplateContext) => BreadcrumbList;
  context: GuideSeoTemplateContext;
}): BreadcrumbList {
  const { lang, guideKey, title, homeLabel, guidesLabel, buildBreadcrumb, context } = params;

  const defaultBreadcrumb = useDefaultBreadcrumb({
    lang,
    guideKey,
    title,
    homeLabel,
    guidesLabel,
  });

  return useMemo<BreadcrumbList>(() => {
    if (typeof buildBreadcrumb === "function") return buildBreadcrumb(context);
    return defaultBreadcrumb;
  }, [buildBreadcrumb, context, defaultBreadcrumb]);
}
