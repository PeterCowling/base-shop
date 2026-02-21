// src/components/guides/generic-content/faqsTitleHelpers.ts
import type { GuideKey } from "@/routes.guides-helpers";

import { toTrimmedString } from "./strings";
import { resolveTitle } from "./translations";
import type {
  GenericContentTranslator,
  TocOverrides,
} from "./types";

interface InitialFaqsTitleParams {
  t: GenericContentTranslator;
  faqsTitleKey: string;
  faqsTitleRaw: unknown;
  faqsRawTrimmed: string;
  faqsFallback: string;
  tocOverrides: TocOverrides;
}

export function resolveInitialFaqsTitle({
  t,
  faqsTitleKey,
  faqsTitleRaw,
  faqsRawTrimmed,
  faqsFallback,
  tocOverrides,
}: InitialFaqsTitleParams): { title: string; suppressed: boolean } {
  let suppressed = false;

  if (typeof faqsTitleRaw === 'string' && faqsRawTrimmed.length === 0) {
    // When the localized title is deliberately blank, prefer an explicit EN
    // fallback if one exists; otherwise mark the heading as suppressed so the
    // section renders without an H2 and the ToC omits the FAQs anchor.
    try {
      const enRaw = t(faqsTitleKey, { lng: 'en' }) as unknown;
      const en = typeof enRaw === 'string' ? enRaw.trim() : '';
      if (en && en !== faqsTitleKey) {
        return { title: en, suppressed: false };
      }
    } catch { /* noop */ }
    suppressed = true;
    return { title: '', suppressed };
  }

  const title = resolveTitle(
    faqsTitleRaw as string,
    faqsTitleKey,
    faqsFallback,
    tocOverrides.labels.get("faqs"),
  );
  return { title, suppressed };
}

export function applyLegacyFaqAlias(
  t: GenericContentTranslator,
  guideKey: GuideKey,
  faqsTitleKey: string,
  currentTitle: string,
): string {
  try {
    const aliasKey = `content.${guideKey}.faqHeading` as const;
    const alias = toTrimmedString(t(aliasKey) as unknown);
    const current = toTrimmedString(currentTitle);
    const isGeneric = current ? current.toLowerCase() === "faqs" || current === faqsTitleKey : false;
    if (alias && alias !== aliasKey && (!current || isGeneric)) {
      return alias;
    }
  } catch {
    /* noop */
  }
  return currentTitle;
}

export function applyFallbackIfGeneric(
  faqsTitle: string,
  faqsFallback: string,
): string {
  if (
    faqsFallback &&
    faqsTitle &&
    faqsTitle.trim().toLowerCase() === "faqs" &&
    faqsFallback.trim().length > 0 &&
    faqsFallback.trim().toLowerCase() !== "faqs"
  ) {
    return faqsFallback;
  }
  return faqsTitle;
}

export function applyAliasKeyLabel(
  t: GenericContentTranslator,
  aliasKey: GuideKey | null | undefined,
  mergeAliasFaqs: boolean,
  currentTitle: string,
): string {
  if (aliasKey && mergeAliasFaqs) {
    try {
      const aliasKeyPath = `content.${aliasKey}.toc.faqs` as const;
      const aliasLabel = toTrimmedString(t(aliasKeyPath) as unknown);
      if (aliasLabel && aliasLabel !== aliasKeyPath) {
        return aliasLabel;
      }
    } catch {
      void 0;
    }
  }
  return currentTitle;
}
