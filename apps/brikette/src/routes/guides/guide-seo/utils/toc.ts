import type { TocItem, NormalisedSection, NormalisedFaq } from "../types";
import type { GuideKey } from "@/routes.guides-helpers";
import { getOptionalString as getOptionalStringUnsafe } from "@/utils/i18nSafe";
import type { TFunction } from "@/utils/i18nSafe";
import i18nApp from "@/i18n";

type TranslatorLike =
  | ((key: string, ...rest: unknown[]) => unknown)
  | TFunction
  | undefined;

// In some unit test environments, modules may be partially mocked and
// named exports like getOptionalString can be undefined or non-functions.
// Guard the helper and provide a minimal fallback implementation that
// preserves the behaviour expected by these utilities.
const getOptionalString: typeof getOptionalStringUnsafe =
  typeof getOptionalStringUnsafe === "function"
    ? getOptionalStringUnsafe
    : ((t: TFunction, key: string, options?: Record<string, unknown>) => {
        try {
          const value = typeof t === "function" ? t(key, options ?? {}) : undefined;
          const s = typeof value === "string" ? value.trim() : "";
          return s && s !== key ? s : undefined;
        } catch {
          return undefined;
        }
      }) as unknown as typeof getOptionalStringUnsafe;

function normalizeRawToc(raw: unknown): TocItem[] {
  const arr = Array.isArray(raw) ? (raw as Array<{ href?: string; label?: string }>) : [];
  return arr
    .map((it) => {
      const label = typeof it?.label === "string" ? it.label.trim() : "";
      const href = typeof it?.href === "string" ? it.href.trim() : "";
      return label.length > 0 ? { href, label } : null;
    })
    .filter((x): x is TocItem => x != null);
}

function faqLabel(tGuides: TFunction, guideKey: GuideKey): string {
  const v = getOptionalString(tGuides, `content.${guideKey}.toc.faqs`);
  return v ?? "FAQs";
}

export type ResolveFaqTitleResult = {
  title?: string;
  suppressed: boolean;
  explicitBlank: boolean;
};

export type ResolveFaqTitleParams = {
  guideKey: GuideKey;
  tGuides: TFunction;
  translateGuides?: TranslatorLike;
  translateGuidesEn?: TranslatorLike;
  fallbackTranslator?: TranslatorLike;
  fallbackToGeneric?: boolean;
  respectBlank?: boolean;
};

function pickMeaningful(value: unknown, sentinels: readonly string[]): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (sentinels.includes(trimmed)) return undefined;
  return trimmed;
}

function tryTranslate(
  translator: TranslatorLike,
  key: string,
  sentinels: readonly string[],
): string | undefined {
  if (typeof translator !== "function") return undefined;
  try {
    const raw = translator(key);
    return pickMeaningful(raw, sentinels);
  } catch {
    return undefined;
  }
}

export function resolveFaqTitle(params: ResolveFaqTitleParams): ResolveFaqTitleResult {
  const {
    guideKey,
    tGuides,
    translateGuides,
    translateGuidesEn,
    fallbackTranslator,
    fallbackToGeneric = true,
    respectBlank = false,
  } = params;

  const sentinelBase = `content.${guideKey}.faqsTitle` as const;
  const sentinels = [sentinelBase, `${guideKey}.faqsTitle`, String(guideKey)];
  const labelSentinels = ["labels.faqsHeading"] as const;
  let explicitBlank = false;

  try {
    const rawLocal = tGuides(sentinelBase) as unknown;
    if (typeof rawLocal === "string" && rawLocal.trim().length === 0) {
      explicitBlank = true;
    }
    const resolvedLocal = pickMeaningful(rawLocal, sentinels);
    if (resolvedLocal) {
      return { title: resolvedLocal, suppressed: false, explicitBlank };
    }
  } catch {
    /* noop */
  }

  const viaFallback =
    tryTranslate(fallbackTranslator, sentinelBase, sentinels) ??
    tryTranslate(translateGuides, sentinelBase, sentinels) ??
    tryTranslate(translateGuidesEn, sentinelBase, sentinels);
  if (viaFallback) {
    return { title: viaFallback, suppressed: false, explicitBlank };
  }

  try {
    const getEn = i18nApp?.getFixedT?.("en", "guides");
    if (typeof getEn === "function") {
      const resolvedEn = pickMeaningful(getEn(sentinelBase) as unknown, sentinels);
      if (resolvedEn) {
        return { title: resolvedEn, suppressed: false, explicitBlank };
      }
    }
  } catch {
    /* noop */
  }

  const labelFallback =
    tryTranslate(tGuides, "labels.faqsHeading", labelSentinels) ??
    tryTranslate(fallbackTranslator, "labels.faqsHeading", labelSentinels) ??
    tryTranslate(translateGuides, "labels.faqsHeading", labelSentinels) ??
    tryTranslate(translateGuidesEn, "labels.faqsHeading", labelSentinels);
  if (labelFallback) {
    return { title: labelFallback, suppressed: false, explicitBlank };
  }

  if (fallbackToGeneric) {
    return { title: "FAQs", suppressed: false, explicitBlank };
  }

  return { suppressed: respectBlank && explicitBlank, explicitBlank };
}

export type ComputeTocParams = {
  guideKey: GuideKey;
  tGuides: TFunction;
  baseToc?: TocItem[] | null;
  contextToc?: TocItem[] | null;
  sections?: NormalisedSection[] | null;
  faqs?: NormalisedFaq[] | null;
  hasLocalizedContent: boolean;
  suppressUnlocalizedFallback?: boolean;
  customProvided?: boolean; // true when a custom builder exists (even if empty output)
  translateGuides?: TranslatorLike;
  translateGuidesEn?: TranslatorLike;
  fallbackTranslator?: TranslatorLike;
};

/**
 * Compute a normalized list of ToC items from multiple sources with consistent rules.
 */
export function computeStructuredTocItems(params: ComputeTocParams): TocItem[] {
  const {
    guideKey,
    tGuides,
    baseToc,
    contextToc,
    sections,
    faqs,
    hasLocalizedContent,
    suppressUnlocalizedFallback,
    customProvided,
    translateGuides,
    translateGuidesEn,
    fallbackTranslator,
  } = params;

  // 1) Route-provided/custom ToC via context. Always allow explicit items.
  if (Array.isArray(contextToc) && contextToc.length > 0) {
    let items = contextToc
      .map((it, idx) => {
        const hrefRaw = typeof it?.href === "string" ? it.href.trim() : "";
        const href = hrefRaw.length > 0 ? hrefRaw : `#section-${idx}`;
        const label = typeof it?.label === "string" ? it.label.trim() : "";
        return href && label ? { href, label } : null;
      })
      .filter((x): x is TocItem => x != null);

    const hasHref = (h: string) => items.some((it) => it.href === h);
    if (Array.isArray(faqs) && faqs.length > 0 && !hasHref("#faqs")) {
      const faqResolved = resolveFaqTitle({
        guideKey,
        tGuides,
        translateGuides,
        translateGuidesEn,
        fallbackTranslator,
      });
      if (!faqResolved.suppressed) {
        items = [
          ...items,
          { href: "#faqs", label: faqResolved.title ?? faqLabel(tGuides, guideKey) },
        ];
      }
    }
    return items;
  }

  // If a custom builder exists but yielded no items, treat as explicit opt-out.
  if (customProvided) return [] as TocItem[];

  // 2) If suppressing unlocalized fallback and no localized content, omit ToC entirely.
  if (suppressUnlocalizedFallback && !hasLocalizedContent) return [] as TocItem[];

  // 3) Prefer normalized Base ToC when it looks complete and contains anchors.
  let rawTocNormalized: TocItem[] = [];
  try {
    const rawToc = tGuides(`content.${guideKey}.toc`, { returnObjects: true }) as unknown;
    rawTocNormalized = normalizeRawToc(rawToc);
  } catch {
    /* noop: missing or non-array toc is acceptable */
  }

  if (Array.isArray(baseToc) && baseToc.length > 0) {
    const allAnchors = baseToc.every((it) => typeof it?.href === "string" && it.href.trim().startsWith("#"));
    const seemsComplete = rawTocNormalized.length === 0 || baseToc.length === rawTocNormalized.length;
    if (allAnchors && seemsComplete) {
      return baseToc.slice();
    }
  }

  // 4) Permissive derivation from localized raw toc
  if (rawTocNormalized.length > 0) return rawTocNormalized;

  // 5) Derive from sections as a last resort
  const itemsFromSections = Array.isArray(sections)
    ? (() => {
        const hasMeaningfulTitle = sections.some(
          (s) => typeof s.title === "string" && s.title.trim().length > 0,
        );
        if (!hasMeaningfulTitle) return [] as TocItem[];
        return sections.map((s, idx) => {
          const normalizedId = s.id && s.id.trim().length > 0 ? s.id.trim() : `section-${idx + 1}`;
          const hrefId = /^section-\d+$/.test(normalizedId) ? `section-${idx + 1}` : normalizedId;
          const href = `#${hrefId}`;
          const label = s.title && s.title.trim().length > 0 ? s.title : `Section ${idx + 1}`;
          return { href, label };
        });
      })()
    : [];
  return itemsFromSections;
}

export function normalizeTocForDisplay(
  itemsBase: TocItem[],
  params: {
    guideKey: GuideKey;
    tGuides: TFunction;
    faqs: NormalisedFaq[] | null | undefined;
    tipsRaw: unknown;
    buildTocItems?: unknown;
    translateGuides?: TranslatorLike;
    translateGuidesEn?: TranslatorLike;
    fallbackTranslator?: TranslatorLike;
  },
): TocItem[] {
  const {
    guideKey,
    tGuides,
    faqs,
    tipsRaw,
    buildTocItems,
    translateGuides,
    translateGuidesEn,
    fallbackTranslator,
  } = params;

  // Base normalization (anchors and fallback labels)
  // Prefer an explicit base label for numbered sections when provided, but
  // ignore mocks that return the guide key itself for unknown content.* paths.
  const baseLabelCandidate = getOptionalString(tGuides, `content.${guideKey}.toc.section`);
  const sectionBaseLabel =
    baseLabelCandidate && baseLabelCandidate !== guideKey ? baseLabelCandidate : "Section";

  const normalized = itemsBase
    .map((it, idx) => {
      const rawHref = typeof it?.href === "string" ? it.href.trim() : "";
      const href = !rawHref
        ? `#section-${idx + 1}`
        : /^#section-\d+$/.test(rawHref)
        ? (typeof buildTocItems === "function" ? rawHref : `#section-${idx + 1}`)
        : rawHref;
      const rawLabel = typeof it?.label === "string" ? it.label.trim() : "";
      const needsFallback = rawLabel.length === 0 || /^section-\d+$/i.test(rawLabel) || /^section\s+\d+$/i.test(rawLabel);
      const label = needsFallback ? `${sectionBaseLabel} ${idx + 1}` : rawLabel;
      return { href, label };
    })
    .filter((x): x is TocItem => Boolean(x && x.href && x.label));

  // When custom builder exists, avoid augmenting with derived anchors
  if (typeof buildTocItems === "function") return normalized;

  // Do not derive additional entries from sections here; rely on the upstream
  // normalization (normalizeGuideToc) to decide if and how to synthesize items
  // from sections. This avoids duplicate or reordered entries when a base ToC
  // is already present.
  let items = normalized.slice();

  const hasHref = (h: string) => items.some((it) => it.href === h);
  const hasTips = (() => {
    try {
      return Array.isArray(tipsRaw) && tipsRaw.length > 0;
    } catch {
      return false;
    }
  })();

  const faqTitle = resolveFaqTitle({
    guideKey,
    tGuides,
    translateGuides,
    translateGuidesEn,
    fallbackTranslator,
  });
  const faqLabelText = (() => {
    const label = faqTitle.title ?? faqLabel(tGuides, guideKey);
    return typeof label === "string" ? label : undefined;
  })();

  // If base/derived items already include a FAQs anchor with a raw-key label,
  // normalise its label using the same fallback rules as above and drop the
  // entry entirely when the localized title explicitly suppresses FAQs.
  items = items
    .map((it) => {
      if (it.href !== "#faqs") return it;
      const raw = typeof it.label === "string" ? it.label.trim() : "";
      const isRawKey =
        raw === `content.${guideKey}.faqsTitle` ||
        raw === `${guideKey}.faqsTitle` ||
        raw === guideKey ||
        /\.faqsTitle$/.test(raw) ||
        raw.length === 0;
      if (faqTitle.suppressed && !faqTitle.title && isRawKey) {
        return null;
      }
      if (!isRawKey) return it;
      const derived = faqTitle.title ?? faqLabel(tGuides, guideKey);
      return { ...it, label: derived };
    })
    .filter((it): it is TocItem => {
      if (!it) return false;
      if (it.href !== "#faqs") return true;
      const label = typeof it.label === "string" ? it.label.trim() : "";
      if (label.length === 0) return false;
      if (faqTitle.suppressed && !faqTitle.title) return false;
      return true;
    });

  if (hasTips && !hasHref("#tips")) {
    const tipsItem = {
      href: "#tips",
      label: (() => {
        try {
          const kLocal = `content.${guideKey}.tipsTitle` as const;
          const rawLocal = tGuides(kLocal) as string;
          if (typeof rawLocal === "string") {
            const v = rawLocal.trim();
            if (v.length > 0 && v !== kLocal) return v;
          }
        } catch {
          /* noop */
        }
        // Prefer an English per‑guide Tips title over generic labels
        try {
          const getEn = i18nApp?.getFixedT?.("en", "guides");
          if (typeof getEn === "function") {
            const kEn = `content.${guideKey}.tipsTitle` as const;
            const rawEn = getEn(kEn) as string;
            if (typeof rawEn === "string") {
              const v = rawEn.trim();
              if (v.length > 0 && v !== kEn) return v;
            }
          }
        } catch {
          /* noop */
        }
        try {
          const fb = tGuides(`labels.tipsHeading` as const) as string;
          if (typeof fb === "string") {
            const v = fb.trim();
            if (v.length > 0 && v !== "labels.tipsHeading") return v;
          }
        } catch {
          /* noop */
        }
        return "Tips";
      })(),
    } satisfies TocItem;
    // If FAQs already exist, insert Tips right before FAQs to preserve expected order.
    const faqIndex = items.findIndex((it) => it.href === "#faqs");
    if (faqIndex >= 0) {
      items = [...items.slice(0, faqIndex), tipsItem, ...items.slice(faqIndex)];
    } else {
      items = [...items, tipsItem];
    }
  }

  // Only include FAQs when there is a non-blank label. A blank
  // content.{guideKey}.faqsTitle explicitly suppresses the FAQ nav.
  if (
    Array.isArray(faqs) &&
    faqs.length > 0 &&
    !hasHref("#faqs") &&
    typeof faqLabelText === "string" &&
    faqLabelText.trim().length > 0
  ) {
    items = [...items, { href: "#faqs", label: faqLabelText }];
  }

  return items;
}
