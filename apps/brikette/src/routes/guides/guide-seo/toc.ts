// src/routes/guides/guide-seo/toc.ts
import type { TOptions } from "i18next";

import { IS_DEV } from "@/config/env";

import type { GuideSeoTemplateContext, TocItem } from "./types";

type Options = {
  /** When true and no items provided, treat as explicit opt-out. */
  customBuilderProvided?: boolean;
  /** Suppress deriving ToC from fallbacks when locale lacks structured content. */
  suppressUnlocalizedFallback?: boolean;
};

const isMeaningfulString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

function dedupeTocItems(items: TocItem[]): TocItem[] {
  const seen = new Set<string>();
  return (Array.isArray(items) ? items : [])
    .map((item) => ({ href: item.href, label: item.label }))
    .filter((item): item is TocItem => {
      if (!item || !isMeaningfulString(item.href) || !isMeaningfulString(item.label)) return false;
      const normalizedHref = item.href.trim();
      if (seen.has(normalizedHref)) return false;
      seen.add(normalizedHref);
      return true;
    });
}

function normaliseHref(
  raw: string | undefined,
  index: number,
  sectionId?: string,
  options?: { preserveNumberedAnchors?: boolean },
): string | null {
  const candidate = (raw ?? "").trim();
  const hasExplicitHref = candidate.length > 0;
  if (hasExplicitHref) {
    const prefixed = candidate.startsWith("#") ? candidate : `#${candidate}`;
    const normalisedLower = prefixed.toLowerCase();
    if (/^#\d+$/u.test(normalisedLower) || /^#section-\d+$/u.test(normalisedLower)) {
      if (options?.preserveNumberedAnchors && hasExplicitHref) {
        return prefixed.startsWith("#section-") ? prefixed : `#section-${index}`;
      }
      return `#section-${index}`;
    }
    // Normalise bare ids like "section-1" → "#section-1"
    return prefixed;
  }
  // Prefer the corresponding section id when available
  const id = typeof sectionId === 'string' && sectionId.trim().length > 0 ? sectionId.trim() : `section-${index}`;
  // Normalise numbered ids to zero-based anchors for test expectations.
  // When preserving numbered anchors (custom builders), keep the provided id
  // so bespoke numbering schemes remain intact.
  const normalised = (() => {
    if (!/^section-\d+$/.test(id)) return id;
    if (options?.preserveNumberedAnchors && hasExplicitHref) return id;
    return `section-${index}`;
  })();
  return `#${normalised}`;
}

function sanitiseItems(
  items: ReadonlyArray<Partial<TocItem>> | unknown,
  sections: GuideSeoTemplateContext["sections"],
  allowMissingDerivedAnchors = false,
): TocItem[] {
  const arr = Array.isArray(items) ? (items as Array<Partial<TocItem>>) : [];
  const validAnchors = new Set(
    (Array.isArray(sections) ? sections : [])
      .filter((s) => isMeaningfulString(s?.id) && Array.isArray(s?.body) && s.body.length > 0)
      .map((s) => `#${s.id!.trim()}`),
  );
  return arr
    .map((it, idx) => {
      const label = isMeaningfulString(it?.label) ? it!.label!.trim() : "";
      if (!label) return null;
      // Compute a candidate href, then validate it against existing section ids.
      const sectionAtIndex = Array.isArray(sections) && sections[idx] ? sections[idx] : undefined;
      const hasMeaningfulSectionAtIndex = Boolean(
        sectionAtIndex && isMeaningfulString(sectionAtIndex.id) && Array.isArray(sectionAtIndex.body) && sectionAtIndex.body.length > 0,
      );
      const hasExplicitHref = isMeaningfulString(it?.href);
      const hrefCandidate = normaliseHref(
        hasExplicitHref ? (it!.href as string) : undefined,
        idx,
        hasMeaningfulSectionAtIndex ? sectionAtIndex!.id : undefined,
        { preserveNumberedAnchors: allowMissingDerivedAnchors },
      );
      if (!hrefCandidate) return null;
      // Only accept derived anchors (when href was omitted) that point to
      // existing sections unless explicitly allowed. For explicit hrefs
      // (provided by routes/tests), allow custom anchors such as "#custom"
      // even if they don't map to a section.
      if (!hasExplicitHref && !allowMissingDerivedAnchors && !validAnchors.has(hrefCandidate)) {
        return null;
      }
      return { href: hrefCandidate, label } satisfies TocItem;
    })
    .filter((e): e is TocItem => Boolean(e));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeLabelValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function debugToc(tag: string, err: unknown): void {
  if (IS_DEV) console.debug(`[toc] ${tag}`, err);
}

function getFallbackTocObject(ctx: GuideSeoTemplateContext, options: TOptions): Record<string, unknown> | null {
  try {
    if (typeof ctx.translateGuides !== "function") return null;
    return asRecord(ctx.translateGuides(`content.${ctx.guideKey}.toc`, options));
  } catch (err) {
    debugToc("translateGuides toc", err);
    return null;
  }
}

function buildItemsFromObjectToc(
  objectToc: Record<string, unknown>,
  fallbackToc: Record<string, unknown> | null,
): TocItem[] {
  const objectEntries = Object.entries(objectToc).filter(([key]) => key !== "onThisPage" && key !== "title");
  const items: TocItem[] = objectEntries
    .map(([key, value], index) => {
      let label = normalizeLabelValue(value);
      if (!label && fallbackToc && key in fallbackToc) {
        label = normalizeLabelValue(fallbackToc[key]);
      }
      if (!label) return null;
      return { href: `#s-${index}`, label } as TocItem;
    })
    .filter((entry): entry is TocItem => entry != null);

  if (!fallbackToc) return items;

  const existingKeys = new Set(objectEntries.map(([key]) => key));
  const fallbackOnlyItems = Object.entries(fallbackToc)
    .filter(([key]) => key !== "onThisPage" && key !== "title" && !existingKeys.has(key))
    .map(([key, value]) => {
      const label = normalizeLabelValue(value);
      if (!label) return null;
      return { href: `#fb-${key}`, label } as TocItem;
    })
    .filter((entry): entry is TocItem => entry != null);

  if (fallbackOnlyItems.length > 0) items.push(...fallbackOnlyItems);
  return items;
}

function appendMissingSectionAnchors(ctx: GuideSeoTemplateContext, items: TocItem[]): TocItem[] {
  if (items.length === 0) return items;
  const anchors = new Set(items.map((item) => item.href));
  const extras = (Array.isArray(ctx.sections) ? ctx.sections : [])
    .filter(
      (section) =>
        isMeaningfulString(section?.id) &&
        isMeaningfulString(section?.title) &&
        Array.isArray(section?.body) &&
        section.body.length > 0 &&
        !anchors.has(`#${section.id!.trim()}`),
    )
    .map((section) => ({ href: `#${section.id!.trim()}`, label: section.title!.trim() } satisfies TocItem));
  return dedupeTocItems(items.concat(extras));
}

function resolvePrimaryTranslatorToc(
  ctx: GuideSeoTemplateContext,
): { explicitEmptyPrimary: boolean; primary: unknown; objectItems: TocItem[] } {
  const options: TOptions = { returnObjects: true };
  let explicitEmptyPrimary = false;
  const primary = ctx.translator(`content.${ctx.guideKey}.toc`, options);
  if (Array.isArray(primary) && primary.length === 0) {
    explicitEmptyPrimary = true;
  }

  const objectToc = asRecord(primary);
  if (!objectToc) {
    return { explicitEmptyPrimary, primary, objectItems: [] };
  }

  const fallbackObject = getFallbackTocObject(ctx, options);
  const objectItems = buildItemsFromObjectToc(objectToc, fallbackObject);
  return { explicitEmptyPrimary, primary, objectItems };
}

function resolveUnlocalizedFallbackToc(ctx: GuideSeoTemplateContext): TocItem[] {
  if (ctx.hasLocalizedContent || ctx.lang === "en") return [];

  let explicitEmptyFallback = false;
  try {
    const options: TOptions = { returnObjects: true };
    const fallbackRaw =
      typeof ctx.translateGuides === "function"
        ? ctx.translateGuides(`content.${ctx.guideKey}.toc`, options)
        : undefined;
    if (Array.isArray(fallbackRaw) && fallbackRaw.length === 0) {
      explicitEmptyFallback = true;
    }
    const fallbackItems = sanitiseItems(fallbackRaw as unknown, ctx.sections);
    if (fallbackItems.length > 0) return dedupeTocItems(fallbackItems);
  } catch (err) {
    debugToc("fallback toc", err);
  }
  return explicitEmptyFallback ? [] : [];
}

function buildFromTranslator(ctx: GuideSeoTemplateContext): TocItem[] {
  try {
    const { explicitEmptyPrimary, primary, objectItems } = resolvePrimaryTranslatorToc(ctx);
    if (objectItems.length > 0) return maybeAppendFaq(ctx, objectItems);

    const itemsFromPrimary = sanitiseItems(primary as unknown, ctx.sections);
    if (itemsFromPrimary.length > 0) {
      return appendMissingSectionAnchors(ctx, itemsFromPrimary);
    }

    if (explicitEmptyPrimary) return [];
  } catch (err) {
    debugToc("localized toc", err);
  }
  return resolveUnlocalizedFallbackToc(ctx);
}

function buildFromSections(ctx: GuideSeoTemplateContext): TocItem[] {
  const sections = Array.isArray(ctx.sections) ? ctx.sections : [];
  const hasMeaningful = sections.some((s) => isMeaningfulString(s?.title));
  if (!hasMeaningful) return [];
  const items = sections
    .filter((s) => isMeaningfulString(s.title) && Array.isArray(s.body) && s.body.length > 0)
    .map((s, idx) => {
      const id = isMeaningfulString(s.id) ? s.id.trim() : `section-${idx}`;
      const normalisedId = /^section-\d+$/.test(id) ? `section-${idx}` : id;
      return { href: `#${normalisedId}`, label: s.title!.trim() } satisfies TocItem;
    });
  return dedupeTocItems(items);
}

function maybeAppendFaq(ctx: GuideSeoTemplateContext, items: TocItem[]): TocItem[] {
  const list = Array.isArray(items) ? items.slice() : [];
  const hasFaqs = hasFaqContentForToc(ctx, list);
  if (!hasFaqs) return list;
  const already = list.some((it) => it.href === "#faqs");
  if (already) return list;
  const label = resolveFaqTocLabel(ctx);
  list.push({ href: "#faqs", label });
  return list;
}

type FaqLabelCandidate = {
  tag: string;
  disallowGuideKey?: boolean;
  disallowedValue?: string;
  read: () => unknown;
};

function normalizeFaqLabelCandidate(
  value: unknown,
  guideKey: string,
  disallowedValue?: string,
  disallowGuideKey = false,
): string | undefined {
  if (!isMeaningfulString(value)) return undefined;
  const trimmed = value.trim();
  if (disallowedValue && trimmed === disallowedValue) return undefined;
  if (disallowGuideKey && trimmed === guideKey) return undefined;
  return trimmed;
}

function resolveFirstFaqLabel(
  ctx: GuideSeoTemplateContext,
  candidates: FaqLabelCandidate[],
): string | undefined {
  for (const candidate of candidates) {
    try {
      const resolved = normalizeFaqLabelCandidate(
        candidate.read(),
        ctx.guideKey,
        candidate.disallowedValue,
        candidate.disallowGuideKey,
      );
      if (resolved) return resolved;
    } catch (err) {
      debugToc(candidate.tag, err);
    }
  }
  return undefined;
}

function resolveFaqTocLabel(ctx: GuideSeoTemplateContext): string {
  const faqsTitleKey = `content.${ctx.guideKey}.faqsTitle`;
  const fallbackFaqLabelKey = `content.${ctx.guideKey}.fallback.faqLabel`;
  const tocFaqsKey = `content.${ctx.guideKey}.toc.faqs`;

  const commonCandidates: FaqLabelCandidate[] = [
    {
      tag: "faqsTitle local",
      disallowedValue: faqsTitleKey,
      read: () => ctx.translator(faqsTitleKey),
    },
    {
      tag: "faqsTitle EN",
      disallowedValue: faqsTitleKey,
      read: () => (typeof ctx.translateGuides === "function" ? ctx.translateGuides(faqsTitleKey) : undefined),
    },
  ];

  if (ctx.hasLocalizedContent) {
    const localized = resolveFirstFaqLabel(ctx, [
      ...commonCandidates,
      {
        tag: "faqsHeading",
        disallowedValue: "labels.faqsHeading",
        read: () => ctx.translator("labels.faqsHeading"),
      },
    ]);
    return localized ?? "FAQs";
  }

  const unlocalizedCandidates: FaqLabelCandidate[] = [
    ...commonCandidates,
    {
      tag: "fallback.faqLabel local",
      disallowedValue: fallbackFaqLabelKey,
      disallowGuideKey: true,
      read: () => ctx.translator(fallbackFaqLabelKey),
    },
    ...(ctx.lang !== "en"
      ? [
          {
            tag: "fallback.faqLabel EN",
            disallowedValue: fallbackFaqLabelKey,
            disallowGuideKey: true,
            read: () =>
              typeof ctx.translateGuides === "function"
                ? ctx.translateGuides(fallbackFaqLabelKey)
                : undefined,
          } satisfies FaqLabelCandidate,
        ]
      : []),
    {
      tag: "faqsTitle toc.faqs",
      disallowedValue: tocFaqsKey,
      read: () => ctx.translator(tocFaqsKey),
    },
    {
      tag: "faqsHeading label",
      disallowedValue: "labels.faqsHeading",
      read: () => ctx.translator("labels.faqsHeading"),
    },
    {
      tag: "faqsHeading EN",
      disallowedValue: "labels.faqsHeading",
      read: () => (typeof ctx.translateGuides === "function" ? ctx.translateGuides("labels.faqsHeading") : undefined),
    },
  ];

  return resolveFirstFaqLabel(ctx, unlocalizedCandidates) ?? "FAQs";
}

function hasFallbackFaqSignals(ctx: GuideSeoTemplateContext): boolean {
  try {
    const summaryKey = `content.${ctx.guideKey}.fallback.faq.summary`;
    const answerKey = `content.${ctx.guideKey}.fallback.faq.answer`;
    const summary = ctx.translateGuides(summaryKey) as unknown;
    const answer = ctx.translateGuides(answerKey) as unknown;
    const isMeaningful = (value: unknown, key: string): boolean => {
      if (!isMeaningfulString(value)) return false;
      const trimmed = value.trim();
      return trimmed.length > 0 && trimmed !== key && trimmed !== ctx.guideKey;
    };
    return isMeaningful(summary, summaryKey) || isMeaningful(answer, answerKey);
  } catch (err) {
    debugToc("hasFaqs check", err);
    return false;
  }
}

function hasFaqContentForToc(ctx: GuideSeoTemplateContext, items: TocItem[]): boolean {
  if (Array.isArray(ctx.faqs) && ctx.faqs.length > 0) return true;
  if (ctx.hasLocalizedContent || items.length > 0 || ctx.lang === "en") return false;
  return hasFallbackFaqSignals(ctx);
}

export function normalizeGuideToc(ctx: GuideSeoTemplateContext, options?: Options): TocItem[] {
  const customProvided = Boolean(options?.customBuilderProvided);
  const suppressUnlocalized = Boolean(options?.suppressUnlocalizedFallback);

  // 1) Prefer context-provided items (already may include builder/base derivations)
  const provided = dedupeTocItems(
    sanitiseItems(
      ctx.toc as unknown as TocItem[],
      ctx.sections,
      /* allowMissingDerivedAnchors */ customProvided,
    ),
  );
  if (provided.length > 0) {
    // When a route supplies a custom builder, respect its output exactly and
    // avoid augmenting with an FAQs entry. Several routes/tests expect a
    // minimal, explicitly‑curated ToC (e.g., a single item) without the
    // automatic FAQs link.
    if (customProvided) return provided;
    // Otherwise, append FAQs when applicable and not already present.
    return maybeAppendFaq(ctx, provided);
  }

  // 2) If a custom builder exists but yielded no items, treat as explicit opt-out
  if (customProvided) return [];

  // 3) Optionally suppress fallbacks when locale lacks structured content
  if (suppressUnlocalized && !ctx.hasLocalizedContent) return [];

  // 4) Derive from i18n toc keys or sections as last resort
  const fromI18n = buildFromTranslator(ctx);
  if (fromI18n.length > 0) return maybeAppendFaq(ctx, fromI18n);

  const fromSections = buildFromSections(ctx);
  return maybeAppendFaq(ctx, fromSections);
}

export type { TocItem };
