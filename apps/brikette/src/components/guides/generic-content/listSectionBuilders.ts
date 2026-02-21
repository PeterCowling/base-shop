// src/components/guides/generic-content/listSectionBuilders.ts
import type { GuideKey } from "@/routes.guides-helpers";

import { toListSection } from "./sections";
import { resolveLabelFallback, resolveTitle } from "./translations";
import type {
  GenericContentTranslator,
  ListSectionConfig,
  TocOverrides,
} from "./types";

export function buildEssentialsSection(
  t: GenericContentTranslator,
  guideKey: GuideKey,
  tocOverrides: TocOverrides,
): ListSectionConfig | null {
  const essentialsTitleKey = `content.${guideKey}.essentialsTitle` as const;
  const essentialsFallback = resolveLabelFallback(t, "labels.essentialsHeading");
  const essentialsTitle = resolveTitle(
    t(essentialsTitleKey) as string,
    essentialsTitleKey,
    essentialsFallback,
    tocOverrides.labels.get("essentials"),
  );

  return toListSection(
    t(`content.${guideKey}.essentials`, { returnObjects: true }),
    essentialsTitle,
    "essentials",
    {
      expectedKey: `content.${guideKey}.essentials`,
      guideKey,
    },
  );
}

export function buildCostsSection(
  t: GenericContentTranslator,
  guideKey: GuideKey,
  tocOverrides: TocOverrides,
): ListSectionConfig | null {
  const costsTitleKey = `content.${guideKey}.typicalCostsTitle` as const;
  const costsFallback = resolveLabelFallback(t, "labels.typicalCostsHeading");
  const costsTitle = resolveTitle(
    t(costsTitleKey) as string,
    costsTitleKey,
    costsFallback,
    tocOverrides.labels.get("costs"),
  );

  return toListSection(
    t(`content.${guideKey}.typicalCosts`, { returnObjects: true }),
    costsTitle,
    "costs",
    {
      expectedKey: `content.${guideKey}.typicalCosts`,
      guideKey,
    },
  );
}
