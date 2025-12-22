import type { GuideSeoTemplateContext } from "./how-to-reach-positano-on-a-budget.types";

import { ensureStringArray } from "@/utils/i18nContent";

import {
  DEFAULT_SECTION_IDS,
  MAP_EMBED_URL_FALLBACK,
  MAP_REFERRER_POLICY,
  GUIDE_KEY,
} from "./how-to-reach-positano-on-a-budget.constants";
import {
  areStepsEqual,
  normaliseMapUrl,
  normaliseReferrerPolicy,
  normaliseSectionIds,
  normaliseSections,
  normaliseSteps,
  safeString,
} from "./how-to-reach-positano-on-a-budget.normalisers";
import type {
  GuideExtras,
  HowToStepDetail,
  TocItem,
} from "./how-to-reach-positano-on-a-budget.types";
import {
  getGuidesTranslator,
} from "./how-to-reach-positano-on-a-budget.translators";

function buildGuideExtras(context: GuideSeoTemplateContext): GuideExtras {
  const translate = context.translateGuides;
  const localizedGuides = context.translator;
  const fallbackGuides = getGuidesTranslator("en");
  const key = GUIDE_KEY;

  const readString = (keyPath: string, fallback?: string) => {
    const fallbackCandidateRaw = fallbackGuides(keyPath);
    const fallbackCandidate = (() => {
      if (typeof fallbackCandidateRaw !== "string") return "";
      const trimmed = fallbackCandidateRaw.trim();
      if (trimmed.length === 0 || trimmed === keyPath) return "";
      return trimmed;
    })();
    const effectiveFallback = fallback ?? fallbackCandidate;
    const raw = translate(
      keyPath,
      effectiveFallback.length > 0 ? { defaultValue: effectiveFallback } : undefined,
    );
    const resolved = safeString(raw);
    if (resolved.length > 0 && resolved !== keyPath) {
      return resolved;
    }
    if (effectiveFallback.length > 0) {
      return effectiveFallback;
    }
    return "";
  };

  const intro = (() => {
    const primary = ensureStringArray(translate(`content.${key}.intro`, { returnObjects: true }));
    if (primary.length > 0) return primary;
    return ensureStringArray(fallbackGuides(`content.${key}.intro`, { returnObjects: true }));
  })();

  const sections = (() => {
    const primary = normaliseSections(translate(`content.${key}.sections`, { returnObjects: true }));
    if (primary.length > 0) return primary;
    return normaliseSections(fallbackGuides(`content.${key}.sections`, { returnObjects: true }));
  })();

  const sectionIds = (() => {
    const fallback = normaliseSectionIds(
      fallbackGuides(`content.${key}.sectionIds`, { returnObjects: true }),
      DEFAULT_SECTION_IDS,
    );
    return normaliseSectionIds(
      translate(`content.${key}.sectionIds`, { returnObjects: true }),
      fallback,
    );
  })();

  const steps = (() => {
    const localized = normaliseSteps(localizedGuides(`content.${key}.steps`, { returnObjects: true }));
    const fallback = normaliseSteps(fallbackGuides(`content.${key}.steps`, { returnObjects: true }));

    if (context.lang === "en") {
      return { data: localized, source: "primary" as const };
    }

    if (!context.hasLocalizedContent) {
      return fallback.length > 0
        ? { data: fallback, source: "fallback" as const }
        : { data: [] as HowToStepDetail[], source: "primary" as const };
    }

    if (localized.length > 0 && !(fallback.length > 0 && areStepsEqual(localized, fallback))) {
      return { data: localized, source: "primary" as const };
    }

    if (fallback.length > 0) {
      return { data: fallback, source: "fallback" as const };
    }

    return { data: [] as HowToStepDetail[], source: "primary" as const };
  })();

  const trainAlternatives = (() => {
    const primary = ensureStringArray(translate(`content.${key}.train`, { returnObjects: true }));
    if (primary.length > 0) return primary;
    return ensureStringArray(fallbackGuides(`content.${key}.train`, { returnObjects: true }));
  })();

  const ferryAlternatives = (() => {
    const primary = ensureStringArray(translate(`content.${key}.ferry`, { returnObjects: true }));
    if (primary.length > 0) return primary;
    return ensureStringArray(fallbackGuides(`content.${key}.ferry`, { returnObjects: true }));
  })();

  const costs = (() => {
    const primary = ensureStringArray(translate(`content.${key}.costs`, { returnObjects: true }));
    if (primary.length > 0) return primary;
    return ensureStringArray(fallbackGuides(`content.${key}.costs`, { returnObjects: true }));
  })();

  const tips = (() => {
    const primary = ensureStringArray(translate(`content.${key}.tips`, { returnObjects: true }));
    if (primary.length > 0) return primary;
    return ensureStringArray(fallbackGuides(`content.${key}.tips`, { returnObjects: true }));
  })();

  const mapHeading = readString(`content.${key}.mapTitle`);
  const stepHeading = readString(`content.${key}.stepByStepTitle`);
  const alternativesHeading = readString(`content.${key}.alternativesTitle`);
  const costsHeading = readString(`content.${key}.costsTitle`);
  const tipsHeading = readString(`content.${key}.tipsTitle`) || readString(`labels.tipsHeading`);
  const trainHeading = readString(`content.${key}.trainTitle`);
  const ferryHeading = readString(`content.${key}.ferryTitle`);
  const mapIframeTitle = readString(`content.${key}.mapIframeTitle`, mapHeading);

  const toc: TocItem[] = [];
  const seen = new Set<string>();
  const addTocItem = (href: string, label: string) => {
    if (!href || !label || seen.has(href)) return;
    seen.add(href);
    toc.push({ href, label });
  };

  sections.forEach((section) => addTocItem(`#${section.id}`, section.title));
  addTocItem(`#${sectionIds.map}`, mapHeading);
  addTocItem(`#${sectionIds.steps}`, stepHeading);
  addTocItem(`#${sectionIds.alternatives}`, alternativesHeading);
  addTocItem(`#${sectionIds.costs}`, costsHeading);
  if (tips.length > 0) {
    addTocItem(`#${sectionIds.tips}`, tipsHeading);
  }

  return {
    intro,
    sections,
    sectionIds,
    toc,
    map: {
      heading: mapHeading,
      iframeTitle: mapIframeTitle,
      url: normaliseMapUrl(translate(`content.${key}.mapEmbedUrl`, { defaultValue: MAP_EMBED_URL_FALLBACK })),
      referrerPolicy: normaliseReferrerPolicy(
        translate(`content.${key}.mapReferrerPolicy`, { defaultValue: MAP_REFERRER_POLICY }),
      ),
    },
    steps: steps.data,
    stepsSource: steps.source,
    stepsHeading: stepHeading,
    alternatives: {
      heading: alternativesHeading,
      trainHeading,
      train: trainAlternatives,
      ferryHeading,
      ferry: ferryAlternatives,
    },
    costs: { heading: costsHeading, items: costs },
    tips: { heading: tipsHeading, items: tips },
    ferryCta: safeString(translate(`content.${key}.ferryCta`)),
    howTo: {
      totalTime: safeString(translate(`content.${key}.howTo.totalTime`)),
      estimatedCostCurrency: safeString(translate(`content.${key}.howTo.estimatedCost.currency`)),
      estimatedCostValue: safeString(translate(`content.${key}.howTo.estimatedCost.value`)),
    },
  } satisfies GuideExtras;
}

export { buildGuideExtras };
