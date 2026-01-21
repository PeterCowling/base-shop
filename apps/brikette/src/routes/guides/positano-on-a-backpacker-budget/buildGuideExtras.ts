// src/routes/guides/positano-on-a-backpacker-budget/buildGuideExtras.ts
import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";

import { GUIDE_KEY, SECTION_IDS } from "./constants";
import {
  getFaqItemsWithFallback,
  getGuidesTranslator,
  getStringArrayWithFallback,
  getStringWithFallback,
  getStringWithFallbackPreserveWhitespace,
  getTocItemsWithFallback,
  getTransportLinksWithFallback,
} from "./translations";
import type { DaySection, GuideExtras, TocItem } from "./types";

export function buildGuideExtras(context: GuideSeoTemplateContext): GuideExtras {
  const translator = getGuidesTranslator(context.lang);
  const fallback = getGuidesTranslator("en");
  const baseKey = `content.${GUIDE_KEY}`;

  const intro = getStringArrayWithFallback(translator, fallback, `${baseKey}.intro`);

  const daySections: DaySection[] = [
    {
      id: SECTION_IDS.day1,
      title: getStringWithFallback(translator, fallback, `${baseKey}.day1Title`),
      items: getStringArrayWithFallback(translator, fallback, `${baseKey}.day1`),
    },
    {
      id: SECTION_IDS.day2,
      title: getStringWithFallback(translator, fallback, `${baseKey}.day2Title`),
      items: getStringArrayWithFallback(translator, fallback, `${baseKey}.day2`),
    },
    {
      id: SECTION_IDS.day3,
      title: getStringWithFallback(translator, fallback, `${baseKey}.day3Title`),
      items: getStringArrayWithFallback(translator, fallback, `${baseKey}.day3`),
    },
  ].filter((section) => section.title.length > 0 && section.items.length > 0);

  const savings = {
    title: getStringWithFallback(translator, fallback, `${baseKey}.savingsTitle`),
    items: getStringArrayWithFallback(translator, fallback, `${baseKey}.savings`),
  };

  const food = {
    title: getStringWithFallback(translator, fallback, `${baseKey}.foodTitle`),
    text:
      getStringWithFallbackPreserveWhitespace(translator, fallback, `${baseKey}.foodText`) ?? "",
  };

  const transportCompareLinks = getTransportLinksWithFallback(
    translator,
    fallback,
    `${baseKey}.transportCompareLinks`,
  );
  const transportTitle = getStringWithFallback(translator, fallback, `${baseKey}.transportTitle`);
  const transportCompareLabel = getStringWithFallback(
    translator,
    fallback,
    `${baseKey}.transportCompareLabel`,
  );
  const transportFerryPrefix = getStringWithFallback(
    translator,
    fallback,
    `${baseKey}.transportFerryPrefix`,
  );
  const transportFerryLinkLabel = getStringWithFallback(
    translator,
    fallback,
    `${baseKey}.transportFerryLinkLabel`,
  );
  const transportFerrySuffix = getStringWithFallback(
    translator,
    fallback,
    `${baseKey}.transportFerrySuffix`,
  );

  const transport = transportTitle.length > 0
    ? {
        title: transportTitle,
        compareLabel: transportCompareLabel,
        compareLinks: transportCompareLinks,
        ferryPrefix: transportFerryPrefix,
        ferryLinkLabel: transportFerryLinkLabel,
        ferrySuffix: transportFerrySuffix,
      }
    : null;

  const faqs = getFaqItemsWithFallback(translator, fallback, {
    current: `${baseKey}.faqs`,
    legacy: `${baseKey}.faq`,
  });
  const faqsTitle = getStringWithFallback(translator, fallback, `${baseKey}.faqsTitle`);

  const toc = (() => {
    const explicit = getTocItemsWithFallback(translator, fallback, `${baseKey}.toc`);
    if (explicit.length > 0) {
      return explicit;
    }
    const items: TocItem[] = [];
    for (const day of daySections) {
      items.push({ href: `#${day.id}`, label: day.title });
    }
    if (savings.title && savings.items.length > 0) {
      items.push({ href: `#${SECTION_IDS.savings}`, label: savings.title });
    }
    if (food.title) {
      items.push({ href: `#${SECTION_IDS.food}`, label: food.title });
    }
    if (transport) {
      items.push({ href: `#${SECTION_IDS.transport}`, label: transport.title });
    }
    if (faqs.length > 0) {
      items.push({ href: "#faqs", label: faqsTitle || "FAQs" });
    }
    return items;
  })();

  const hasStructured =
    intro.length > 0 ||
    daySections.length > 0 ||
    savings.items.length > 0 ||
    (food.text?.length ?? 0) > 0 ||
    transport !== null ||
    faqs.length > 0;

  return {
    hasStructured,
    intro,
    toc,
    days: daySections,
    savings,
    food,
    transport,
    faqs,
    ...(faqsTitle ? { faqsTitle } : {}),
  } satisfies GuideExtras;
}
