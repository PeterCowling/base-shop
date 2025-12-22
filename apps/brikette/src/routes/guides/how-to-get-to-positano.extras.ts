// src/routes/guides/how-to-get-to-positano.extras.ts
import { ensureStringArray } from "@/utils/i18nContent";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { GUIDE_KEY } from "./how-to-get-to-positano.constants";
import { safeString, normaliseSections, normaliseWhenItems } from "./how-to-get-to-positano.normalizers";
import type { GuideExtras, TocItem } from "./how-to-get-to-positano.types";
import { getGuidesTranslator } from "./how-to-get-to-positano.translators";

export function buildGuideExtras(context: GuideSeoTemplateContext): GuideExtras {
  const translate = context.translateGuides;
  const fallbackGuides = getGuidesTranslator("en");

  const cleanStrings = (values: string[]): string[] =>
    values
      .map((value) => safeString(value))
      .filter((value) => value.length > 0);

  const readArray = (suffix: string): string[] => {
    const primary = cleanStrings(
      ensureStringArray(translate(`content.${GUIDE_KEY}.${suffix}`, { returnObjects: true })),
    );
    if (primary.length > 0) return primary;
    return cleanStrings(
      ensureStringArray(fallbackGuides(`content.${GUIDE_KEY}.${suffix}`, { returnObjects: true })),
    );
  };

  const readSections = () => {
    const primary = normaliseSections(translate(`content.${GUIDE_KEY}.sections`, { returnObjects: true }));
    if (primary.length > 0) return primary;
    return normaliseSections(fallbackGuides(`content.${GUIDE_KEY}.sections`, { returnObjects: true }));
  };

  const readWhenItems = () => {
    const primary = normaliseWhenItems(translate(`content.${GUIDE_KEY}.when.items`, { returnObjects: true }));
    if (primary.length > 0) return primary;
    return normaliseWhenItems(fallbackGuides(`content.${GUIDE_KEY}.when.items`, { returnObjects: true }));
  };

  const readFromTranslator = (translator: typeof translate, key: string) => {
    const value = translator(key, { defaultValue: "" });
    const normalised = safeString(value);
    if (normalised.length === 0) return "";
    if (typeof value === "string" && value.trim() === key) return "";
    return normalised;
  };

  const readStrings = (key: string) => ({
    local: readFromTranslator(translate, key),
    fallback: readFromTranslator(fallbackGuides, key),
  });

  const resolveHeading = (titleKey: string, labelKey: string) => {
    const { local: localTitle, fallback: fallbackTitle } = readStrings(titleKey);
    const { local: localLabel, fallback: fallbackLabel } = readStrings(labelKey);

    if (localTitle.length > 0 && localTitle !== fallbackTitle) return localTitle;
    if (localLabel.length > 0 && localLabel !== fallbackLabel) return localLabel;
    if (fallbackTitle.length > 0) return fallbackTitle;
    if (fallbackLabel.length > 0) return fallbackLabel;
    return localLabel || localTitle || "";
  };

  const intro = readArray("intro");
  const sections = readSections();
  const whenItems = readWhenItems();
  const cheapestSteps = readArray("cheapest.steps");
  const seasonalPoints = readArray("seasonal.points");

  const whenHeading = resolveHeading(
    `content.${GUIDE_KEY}.when.title`,
    `content.${GUIDE_KEY}.labels.whenHeading`,
  );
  const cheapestHeading = resolveHeading(
    `content.${GUIDE_KEY}.cheapest.title`,
    `content.${GUIDE_KEY}.labels.cheapestHeading`,
  );
  const seasonalHeading = resolveHeading(
    `content.${GUIDE_KEY}.seasonal.title`,
    `content.${GUIDE_KEY}.labels.seasonalHeading`,
  );

  const toc: TocItem[] = [];
  if (sections.length > 0) {
    sections.forEach((section) => toc.push({ href: `#${section.id}`, label: section.title }));
  } else {
    if (whenItems.length > 0) toc.push({ href: "#when", label: whenHeading });
    if (cheapestSteps.length > 0) toc.push({ href: "#cheapest", label: cheapestHeading });
    if (seasonalPoints.length > 0) toc.push({ href: "#seasonal", label: seasonalHeading });
  }

  return {
    intro,
    sections,
    toc,
    when: { heading: whenHeading, items: whenItems },
    cheapest: { heading: cheapestHeading, steps: cheapestSteps },
    seasonal: { heading: seasonalHeading, points: seasonalPoints },
  } satisfies GuideExtras;
}
