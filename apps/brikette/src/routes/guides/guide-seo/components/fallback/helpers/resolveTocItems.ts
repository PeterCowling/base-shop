import { unifyNormalizedFaqEntries } from "@/utils/seo/jsonld";

import type { TocItem, Translator } from "../../../types";
import type { FallbackTranslator, StructuredFallback } from "../../../utils/fallbacks";

type TocItemsWithMeta = TocItem[] & { __hadMissingHref?: boolean };

type MeaningfulSection = { id: string; title?: unknown; body?: unknown[] };

// Helper to fetch ToC data from fallback sources
function fetchTocFromFallback(
  tFb: FallbackTranslator | undefined,
  guideKey: string,
  legacyKey: string,
): { explicitlyProvided: unknown; providedViaLegacy: unknown } {
  let explicitlyProvided: unknown = [];
  let providedViaLegacy: unknown = [];
  try {
    explicitlyProvided = tFb?.(`content.${guideKey}.toc`, { returnObjects: true }) as unknown;
  } catch {
    /* ignore */
  }
  try {
    providedViaLegacy = tFb?.(`${guideKey}.toc`, { returnObjects: true }) as unknown;
  } catch {
    /* ignore */
  }
  if ((!Array.isArray(explicitlyProvided) || explicitlyProvided.length === 0) && (!Array.isArray(providedViaLegacy) || providedViaLegacy.length === 0)) {
    try {
      explicitlyProvided = tFb?.(`content.${legacyKey}.toc`, { returnObjects: true }) as unknown;
    } catch { /* noop */ }
    try {
      providedViaLegacy = tFb?.(`${legacyKey}.toc`, { returnObjects: true }) as unknown;
    } catch { /* noop */ }
  }
  return { explicitlyProvided, providedViaLegacy };
}

// Helper to resolve alias ToC when base is empty
function resolveAliasToc(
  tFb: FallbackTranslator | undefined,
  t: Translator,
  aliasKey: string,
  base: unknown,
): unknown {
  let result = base;
  try {
    const aliasFb = tFb?.(`content.${aliasKey}.toc`, { returnObjects: true }) as unknown;
    if (Array.isArray(aliasFb) && aliasFb.length > 0) result = aliasFb;
  } catch {
    /* noop */
  }
  if (!Array.isArray(result) || result.length === 0) {
    try {
      const aliasLocal = t(`content.${aliasKey}.toc`, { returnObjects: true }) as unknown;
      if (Array.isArray(aliasLocal) && aliasLocal.length > 0) result = aliasLocal;
    } catch {
      /* noop */
    }
  }
  return result;
}

// Helper to derive ToC items from object format
function deriveFromObject(
  value: unknown,
  meaningfulSections: MeaningfulSection[],
): TocItemsWithMeta | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return null;
  let hadMissingHref = false;
  const items = entries
    .filter(([key]) => key !== "onThisPage" && key !== "title")
    .map(([key, raw], index) => {
      const label = typeof raw === "string" ? raw.trim() : "";
      if (!label) return null;
      const keyTrimmed = key.trim();
      if (keyTrimmed.length === 0) {
        hadMissingHref = true;
        const match = meaningfulSections.find(
          (section) => typeof section?.title === "string" && section.title.trim() === label,
        );
        const derivedId = match?.id ?? `s-${index}`;
        return { href: `#${derivedId}`, label } satisfies TocItem;
      }
      const normalisedKey = keyTrimmed.replace(/\s+/g, "-");
      const href = normalisedKey.startsWith("#") ? normalisedKey : `#${normalisedKey}`;
      return { href, label } satisfies TocItem;
    })
    .filter((item): item is TocItem => item != null);
  if (items.length === 0) return null;
  const withMeta = items as TocItemsWithMeta;
  if (hadMissingHref) withMeta.__hadMissingHref = true;
  return withMeta;
}

// Helper to derive ToC items from array format
function deriveFromArray(
  arr: Array<{ href?: unknown; label?: unknown }>,
  meaningfulSections: MeaningfulSection[],
): TocItemsWithMeta {
  let hadMissingHref = false;
  const items = arr
    .map((it, index) => {
      const rawHref = typeof it?.href === "string" ? (it.href as string).trim() : "";
      const label = typeof it?.label === "string" ? (it.label as string).trim() : "";
      if (!label) return null;
      if (rawHref) {
        const normalised = rawHref.startsWith("#") ? rawHref : `#${rawHref}`;
        return { href: normalised, label } as TocItem;
      }
      hadMissingHref = true;
      const match = meaningfulSections.find(
        (s) => typeof s?.title === 'string' && s.title.trim() === label,
      );
      const derivedId = match?.id ?? `s-${index}`;
      return { href: `#${derivedId}`, label } as TocItem;
    })
    .filter((x): x is TocItem => x != null);
  const itemsWithMeta = items as TocItemsWithMeta;
  itemsWithMeta.__hadMissingHref = hadMissingHref;
  return itemsWithMeta;
}

type ResolveTocItemsParams = {
  tFb: FallbackTranslator | undefined;
  t: Translator;
  guideKey: string;
  legacyKey: string;
  aliasKey: string | null | undefined;
  mergeAliasFaqs: boolean;
  meaningfulSections: MeaningfulSection[];
};

export function resolveTocItems(params: ResolveTocItemsParams): TocItem[] {
  const {
    tFb,
    t,
    guideKey,
    legacyKey,
    aliasKey,
    mergeAliasFaqs,
    meaningfulSections,
  } = params;
  const { explicitlyProvided, providedViaLegacy } = fetchTocFromFallback(tFb, guideKey, legacyKey);

  const explicitArray = Array.isArray(explicitlyProvided) ? explicitlyProvided : [];
  const legacyArray = Array.isArray(providedViaLegacy) ? providedViaLegacy : [];

  // Check for explicit opt-out
  if (
    (Array.isArray(explicitlyProvided) && explicitArray.length === 0) ||
    (Array.isArray(providedViaLegacy) && legacyArray.length === 0)
  ) {
    return [] as TocItem[];
  }

  let base: unknown = explicitArray.length > 0 ? explicitArray : legacyArray;

  // Resolve alias ToC if needed
  if (aliasKey && mergeAliasFaqs && (!Array.isArray(base) || base.length === 0)) {
    base = resolveAliasToc(tFb, t, aliasKey, base);
  }

  // Try deriving from object format
  const fromExplicitObject = deriveFromObject(explicitlyProvided, meaningfulSections);
  if (fromExplicitObject && fromExplicitObject.length > 0) {
    return fromExplicitObject;
  }

  const fromLegacyObject = deriveFromObject(providedViaLegacy, meaningfulSections);
  if (fromLegacyObject && fromLegacyObject.length > 0) {
    return fromLegacyObject;
  }

  // Try deriving from array format
  if (Array.isArray(base) && base.length > 0) {
    return deriveFromArray(base as Array<{ href?: unknown; label?: unknown }>, meaningfulSections);
  }

  // Derive from sections as last resort
  return meaningfulSections
    .map((section) => ({
      href: `#${section.id}`,
      label: typeof section.title === "string" ? section.title.trim() : "",
    }))
    .filter((item) => item.label.length > 0);
}

export function filterTocItems(tocItems: TocItem[]): TocItem[] {
  const synthetic = (href: string) => /^#s-\d+$/i.test(href);
  if (tocItems.length <= 1) return tocItems;
  const hasReal = tocItems.some((it) => !synthetic(it.href));
  const hadMissingHref = Boolean((tocItems as TocItemsWithMeta).__hadMissingHref);
  // When explicit ToC items omitted hrefs, we explicitly derived synthetic
  // anchors for them. Keep those alongside real anchors to match tests that
  // expect entries like ["#s-0", "#tips"]. Otherwise, prefer removing
  // synthetic anchors when real ones are present.
  if (hasReal && !hadMissingHref) {
    return tocItems.filter((it) => !synthetic(it.href));
  }
  return tocItems;
}

export function finalizeTocItems(
  filteredTocItemsBase: TocItem[],
  tFb: FallbackTranslator | undefined,
  guideKey: string,
  legacyKey: string,
): TocItem[] {
  if (Array.isArray(filteredTocItemsBase) && filteredTocItemsBase.length > 0) return filteredTocItemsBase;
  try {
    const toArray = (v: unknown): Array<{ id?: unknown; title?: unknown }> =>
      Array.isArray(v) ? (v as Array<{ id?: unknown; title?: unknown }>) : [];
    const a = toArray(tFb?.(`content.${guideKey}.sections`, { returnObjects: true }));
    const b = toArray(tFb?.(`${guideKey}.sections`, { returnObjects: true }));
    const c = toArray(tFb?.(`content.${legacyKey}.sections`, { returnObjects: true }));
    const d = toArray(tFb?.(`${legacyKey}.sections`, { returnObjects: true }));
    const firstNonEmpty = [a, b, c, d].find((arr) => Array.isArray(arr) && arr.length > 0) ?? [];
    const derived = firstNonEmpty
      .map((s, index) => {
        const rawId = typeof s?.id === 'string' ? s.id.trim() : '';
        const id = rawId || `s-${index}`;
        const title = typeof s?.title === 'string' ? s.title.trim() : '';
        if (!title) return null;
        return { href: `#${id}`, label: title } as TocItem;
      })
      .filter((x): x is TocItem => x != null);
    return derived.length > 0 ? derived : filteredTocItemsBase;
  } catch {
    return filteredTocItemsBase;
  }
}

type AddFaqToTocParams = {
  filteredTocItems: TocItem[];
  tFb: FallbackTranslator | undefined;
  t: Translator;
  guideKey: string;
  legacyKey: string;
  fallback: StructuredFallback;
  preferManualWhenUnlocalized: boolean | undefined;
};

export function addFaqToToc(params: AddFaqToTocParams): TocItem[] {
  const {
    filteredTocItems,
    tFb,
    t,
    guideKey,
    legacyKey,
    fallback,
    preferManualWhenUnlocalized,
  } = params;
  // Prefer a curated/manual-style ToC for unlocalized locales when the
  // route opts into manual handling. This mirrors RenderStructuredArrays so
  // tests can assert items like ["#s-0", "#parks", "#s-2"] and avoids
  // injecting a FAQs link into the ToC.
  if (preferManualWhenUnlocalized) {
    try {
      const introArr = Array.isArray(fallback?.intro) ? (fallback.intro as unknown[]) : [];
      const introFirst = (() => {
        for (const p of introArr) {
          if (typeof p === 'string' && p.trim().length > 0) return p.trim();
        }
        return '';
      })();
      const toArr = (v: unknown): Array<{ href?: string; label?: string }> =>
        Array.isArray(v) ? (v as Array<{ href?: string; label?: string }>) : [];
      let tocRaw = toArr(tFb?.(`content.${guideKey}.toc`, { returnObjects: true }));
      if (tocRaw.length === 0) tocRaw = toArr(tFb?.(`${guideKey}.toc`, { returnObjects: true }));
      const itemsManual = tocRaw
        .map((it, idx) => {
          const rawLabel = typeof it?.label === 'string' ? it.label.trim() : '';
          const rawHref = typeof it?.href === 'string' ? it.href.trim() : '';
          const href0 = rawHref || `#s-${idx}`;
          const href = href0.startsWith('#') ? href0 : `#${href0}`;
          const label = rawLabel || (idx === 0 && introFirst ? introFirst : '');
          return label ? { href, label } : null;
        })
        .filter((x): x is TocItem => x != null)
        // Do not include FAQs in the manual ToC; that section renders below
        .filter((it) => it.href !== '#faqs');
      if (itemsManual.length > 0) return itemsManual;
    } catch { /* fall through to default logic */ }
  }

  // Include FAQs anchor when fallback FAQs exist and not already listed.
  if (!Array.isArray(filteredTocItems)) return filteredTocItems;
  try {
    const already = filteredTocItems.some((it) => it.href === '#faqs');
    if (already) return filteredTocItems;
    const hasFaqs = (() => {
      try {
        const rawA = tFb?.(`content.${guideKey}.faqs`, { returnObjects: true }) as unknown;
        const rawB = tFb?.(`content.${guideKey}.faq`, { returnObjects: true }) as unknown;
        const a = unifyNormalizedFaqEntries(rawA);
        const b = unifyNormalizedFaqEntries(rawB);
        if ((a.length > 0 ? a : b).length > 0) return true;
        const rawC = tFb?.(`content.${legacyKey}.faqs`, { returnObjects: true }) as unknown;
        const rawD = tFb?.(`${legacyKey}.faqs`, { returnObjects: true }) as unknown;
        const c = unifyNormalizedFaqEntries(rawC);
        const d = unifyNormalizedFaqEntries(rawD);
        return (c.length > 0 ? c : d).length > 0;
      } catch {
        return false;
      }
    })();
    if (!hasFaqs) return filteredTocItems;
    const label = (() => {
      try {
        const k1 = `content.${guideKey}.faqsTitle` as const;
        const raw: unknown = tFb?.(k1);
        const s = typeof raw === 'string' ? raw.trim() : '';
        if (s && s !== k1) return s;
      } catch { /* noop */ }
      try {
        const k2 = `${guideKey}.faqsTitle` as const;
        const raw: unknown = tFb?.(k2);
        const s = typeof raw === 'string' ? raw.trim() : '';
        if (s && s !== k2) return s;
      } catch { /* noop */ }
      return (t('labels.faqsHeading', { defaultValue: 'FAQs' }) as string) ?? 'FAQs';
    })();
    return [...filteredTocItems, { href: '#faqs', label }];
  } catch {
    return filteredTocItems;
  }
}
