// src/components/guides/generic-content/titleResolvers.ts
import type { GuideKey } from "@/routes.guides-helpers";

import { resolveLabelFallback, resolveTitle } from "./translations";
import type {
  GenericContentTranslator,
  TocOverrides,
} from "./types";

export function resolveTipsTitle(
  t: GenericContentTranslator,
  guideKey: GuideKey,
  tocOverrides: TocOverrides,
): string {
  const tipsKey = "labels.tipsHeading" as const;
  const defaultTipsTitle = resolveLabelFallback(t, tipsKey);
  const tipsTitleKey = `content.${guideKey}.tipsTitle` as const;

  return resolveTitle(
    t(tipsTitleKey) as string,
    tipsTitleKey,
    defaultTipsTitle,
    tocOverrides.labels.get("tips"),
  );
}

export function resolveWarningsTitle(
  t: GenericContentTranslator,
  guideKey: GuideKey,
  tocOverrides: TocOverrides,
): string {
  const warningsKey = "labels.warningsHeading" as const;
  const defaultWarningsTitle = resolveLabelFallback(t, warningsKey);
  const warningsTitleKey = `content.${guideKey}.warningsTitle` as const;

  return resolveTitle(
    t(warningsTitleKey) as string,
    warningsTitleKey,
    defaultWarningsTitle,
    tocOverrides.labels.get("warnings"),
  );
}

export function resolveTocTitle(
  t: GenericContentTranslator,
  guideKey: string,
  tocOverrides: TocOverrides,
): string | undefined {
  const tocTitleKey = `content.${guideKey}.tocTitle` as const;
  const tocTitleRaw = t(tocTitleKey) as string;

  if (
    typeof tocTitleRaw === "string" &&
    tocTitleRaw.trim().length > 0 &&
    tocTitleRaw !== tocTitleKey
  ) {
    return tocTitleRaw;
  }

  if (tocOverrides.title && tocOverrides.title.trim().length > 0) {
    return tocOverrides.title;
  }

  return undefined;
}
