import { COST_ITEM_DEFS, GUIDE_KEY } from "./constants";
import { getGuidesTranslator } from "./translator";
import { getString, getStringArray } from "./strings";
import { normaliseFaqs, normaliseSections, normaliseStringList } from "./normalisers";
import type { GuideExtras, TocItem } from "./types";
import type { TFunction } from "i18next";

export type { GuideExtras } from "./types";
import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";

export function buildGuideExtras(context: GuideSeoTemplateContext): GuideExtras {
  const translator = context.translateGuides as TFunction<"guides">;
  const fallback = getGuidesTranslator("en");

  const intro = getStringArray(translator, fallback, `content.${GUIDE_KEY}.intro`);
  const sections = normaliseSections(
    translator(`content.${GUIDE_KEY}.sections`, { returnObjects: true }),
    fallback,
  );
  const tips = normaliseStringList(translator(`content.${GUIDE_KEY}.tips`, { returnObjects: true }));
  const faqs = normaliseFaqs(translator(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }));

  const costItems = COST_ITEM_DEFS.map((item) => {
    const tableKey = `content.${GUIDE_KEY}.table.${item.key}`;
    const primaryLabel = getString(translator, translator, tableKey, item.key);
    const hasPrimary = primaryLabel.length > 0 && primaryLabel !== item.key;

    const shouldUseFallback = !hasPrimary && !context.hasLocalizedContent;
    const fallbackLabel = shouldUseFallback
      ? getString(fallback, fallback, tableKey, item.key)
      : item.key;

    const label = hasPrimary
      ? primaryLabel
      : shouldUseFallback && fallbackLabel !== item.key
        ? fallbackLabel
        : item.key;

    return {
      label,
      low: item.low,
      mid: item.mid,
      high: item.high,
    };
  });

  const atAGlanceLabel = getString(translator, fallback, `content.${GUIDE_KEY}.labels.atAGlance`);
  const tocTitle = getString(translator, fallback, `content.${GUIDE_KEY}.labels.tocTitle`);
  const tipsTitle = getString(translator, fallback, `content.${GUIDE_KEY}.labels.tipsTitle`);
  const faqsTitle = getString(translator, fallback, `content.${GUIDE_KEY}.labels.faqsTitle`);
  const costTitle = getString(translator, fallback, `labels.costBreakdownTitle`);

  const tocItems: TocItem[] = [];
  tocItems.push({ href: "#at-a-glance", label: atAGlanceLabel });
  sections.forEach((section) => {
    tocItems.push({ href: `#${section.id}`, label: section.title });
  });
  if (tips.length > 0) {
    tocItems.push({ href: "#tips", label: tipsTitle });
  }
  if (faqs.length > 0) {
    tocItems.push({ href: "#faqs", label: faqsTitle });
  }

  const hasStructured =
    intro.length > 0 || sections.length > 0 || tips.length > 0 || faqs.length > 0 || costItems.length > 0;

  return {
    intro,
    sections,
    ...(tocTitle ? { tocTitle } : {}),
    tocItems,
    atAGlanceLabel,
    costItems,
    costTitle,
    ...(tipsTitle ? { tipsTitle } : {}),
    tips,
    ...(faqsTitle ? { faqsTitle } : {}),
    faqs,
    hasStructured,
  } satisfies GuideExtras;
}
