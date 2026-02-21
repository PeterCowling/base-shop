import type { GuideKey } from "@/guides/slugs";
import type { AppLanguage } from "@/i18n.config";
import { debugGuide } from "@/utils/debug";
import type { TFunction } from "@/utils/i18nSafe";
import { ensureStringArray } from "@/utils/i18nSafe";

import {
  checkManualLabelsCollapsed,
  fetchManualFallbacks,
  hasMeaningfulManual,
  normaliseManualSections,
  normaliseManualToc,
  resolveManualTocItems,
  resolveManualTocTitle,
  toStrictStringArray,
} from "./helpers/manualFallbackUtils";
import { ManualObjectContent } from "./ManualObjectContent";

interface Props {
  translations: { tGuides: TFunction };
  hookI18n?: { getFixedT?: (lng: string, ns: string) => TFunction | undefined };
  guideKey: GuideKey;
  lang: AppLanguage;
  t: TFunction;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  fallbackTranslator?: TFunction | undefined;
}

/** Manual object fallback under content.{guideKey}.fallback */
export default function RenderManualObject({
  translations,
  hookI18n,
  guideKey,
  lang,
  t,
  showTocWhenUnlocalized,
  suppressTocTitle,
  fallbackTranslator,
}: Props): JSX.Element | null {
  try {
    const { manualLocal, manualEn } = fetchManualFallbacks(translations, hookI18n, guideKey);
    if (!manualLocal && !manualEn) return null;

    const base = (hasMeaningfulManual(manualLocal) ? manualLocal : manualEn) ?? {};
    const getStrLocal = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    const introEff = toStrictStringArray(base.intro);

    const faqSummary = getStrLocal(base?.faq?.summary);
    const faqAnswerArr = ensureStringArray(base?.faq?.answer);
    // Avoid hardcoded copy; prefer translation or omit the heading when absent
    const faqLabelRaw = t("labels.faqsHeading") as unknown;
    const faqLabel = typeof faqLabelRaw === "string" && faqLabelRaw.trim() !== "labels.faqsHeading"
      ? faqLabelRaw.trim()
      : "";

    const sectionsEff = normaliseManualSections(base);

    const tocWasProvided = Object.prototype.hasOwnProperty.call(base ?? {}, "toc");
    const tocBase = Array.isArray(base?.toc) ? base!.toc! : [];
    const tocEnBase = Array.isArray(manualEn?.toc)
      ? (manualEn!.toc)
      : [];

    const manualLabelsCollapsed = checkManualLabelsCollapsed(t, guideKey);

    const tocLocal = normaliseManualToc(tocBase, sectionsEff);
    const tocEn = normaliseManualToc(tocEnBase, sectionsEff);

    const tocItems = resolveManualTocItems(tocWasProvided, tocLocal, tocEn, manualLabelsCollapsed, sectionsEff);

    try {
      debugGuide(
        "GuideSeoTemplate object fallback toc", // i18n-exempt -- DEV-000 [ttl=2099-12-31] Debug label
        tocItems,
      );
    } catch {
      void 0;
    }

    // If both intro and sections are empty, suppress fallback rendering
    // altogether (including any toc-only entries). This matches tests that
    // expect no fallback output when curated copy sanitises away.
    if (introEff.length === 0 && sectionsEff.length === 0) return null;

    const tocTitle = resolveManualTocTitle(manualLocal, manualEn, fallbackTranslator, guideKey);

    return (
      <ManualObjectContent
        introEff={introEff}
        tocItems={tocItems}
        showTocWhenUnlocalized={showTocWhenUnlocalized}
        suppressTocTitle={suppressTocTitle}
        tocTitle={tocTitle}
        sectionsEff={sectionsEff}
        faqLabel={faqLabel}
        faqSummary={faqSummary}
        faqAnswerArr={faqAnswerArr}
        lang={lang}
        guideKey={guideKey}
      />
    );
  } catch {
    void 0;
  }
  return null;
}
