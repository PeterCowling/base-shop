import { shouldMergeAliasFaqs } from "@/config/guide-overrides";
import { ensureArray, ensureStringArray } from "@/utils/i18nSafe";

import type { Translator } from "../../types";
import type { FallbackTranslator } from "../../utils/fallbacks";

export interface GuidesTranslationsMinimal {
  tGuides: Translator;
  guidesEn?: Translator;
}

export type TocEntry = { href: string; label: string };

export type StructuredSection = { id: string; title: string; body: string[] };

interface ResolveStructuredArrayContentParams {
  tFb: FallbackTranslator | undefined;
  translations: GuidesTranslationsMinimal;
  guideKey: string;
  alias?: string | null;
  showTocWhenUnlocalized: boolean;
  preferManualWhenUnlocalized?: boolean;
}

export type StructuredArrayContent = {
  intro: string[];
  introFromEn: boolean;
  tocItems: TocEntry[];
  sections: StructuredSection[];
  derivedFromDays: StructuredSection[];
};

export function resolveStructuredArrayContent({
  tFb,
  translations,
  guideKey,
  alias,
  showTocWhenUnlocalized,
  preferManualWhenUnlocalized,
}: ResolveStructuredArrayContentParams): StructuredArrayContent {
  const tEn = translations?.guidesEn;

  let introFbPrimary = ensureStringArray(tFb?.(`content.${guideKey}.intro`, { returnObjects: true }));
  if (alias && introFbPrimary.length === 0) {
    try {
      const aliasIntro = ensureStringArray(
        translations.tGuides(`content.${alias}.intro`, { returnObjects: true }) as unknown,
      );
      if (aliasIntro.length > 0) introFbPrimary = aliasIntro;
    } catch {
      /* noop: alias not available */
    }
  }
  const introFbAlt = introFbPrimary.length === 0
    ? ensureStringArray(tFb?.(`${guideKey}.intro`, { returnObjects: true }))
    : [];
  const introFb = (() => {
    if (introFbPrimary.length > 0) return introFbPrimary;
    if (introFbAlt.length > 0) return introFbAlt;
    // Avoid falling back to EN structured intro when preferring manual paths
    if (preferManualWhenUnlocalized) return [] as string[];
    return showTocWhenUnlocalized
      ? ensureStringArray(tEn?.(`content.${guideKey}.intro`, { returnObjects: true }) as unknown)
      : [];
  })();
  const introFromEn = introFbPrimary.length === 0 && introFbAlt.length === 0 && introFb.length > 0;

  let tocFbRaw = ensureArray<{ href?: string; label?: string }>(
    tFb?.(`content.${guideKey}.toc`, { returnObjects: true }),
  );
  if (tocFbRaw.length === 0) {
    tocFbRaw = ensureArray<{ href?: string; label?: string }>(
      tFb?.(`${guideKey}.toc`, { returnObjects: true }),
    );
  }
  if (alias && tocFbRaw.length === 0) {
    try {
      let aliasToc = ensureArray<{ href?: string; label?: string }>(
        tFb?.(`content.${alias}.toc`, { returnObjects: true }),
      );
      if (aliasToc.length === 0) {
        aliasToc = ensureArray<{ href?: string; label?: string }>(
          tFb?.(`${alias}.toc`, { returnObjects: true }),
        );
      }
      if (aliasToc.length === 0) {
        aliasToc = ensureArray<{ href?: string; label?: string }>(
          translations.tGuides(`content.${alias}.toc`, { returnObjects: true }) as unknown,
        );
      }
      if (aliasToc.length > 0) tocFbRaw = aliasToc;
    } catch {
      /* noop: alias not available */
    }
  }

  let sectionsFb1Raw = ensureArray<{
    id?: string;
    title?: string;
    body?: unknown;
    items?: unknown;
  }>(tFb?.(`content.${guideKey}.sections`, { returnObjects: true }));
  if (sectionsFb1Raw.length === 0) {
    sectionsFb1Raw = ensureArray<{
      id?: string;
      title?: string;
      body?: unknown;
      items?: unknown;
    }>(tFb?.(`${guideKey}.sections`, { returnObjects: true }));
  }
  if (alias && sectionsFb1Raw.length === 0) {
    try {
      let aliasSections = ensureArray<{ id?: string; title?: string; body?: unknown; items?: unknown }>(
        tFb?.(`content.${alias}.sections`, { returnObjects: true }),
      );
      if (aliasSections.length === 0) {
        aliasSections = ensureArray<{ id?: string; title?: string; body?: unknown; items?: unknown }>(
          tFb?.(`${alias}.sections`, { returnObjects: true }),
        );
      }
      if (aliasSections.length === 0) {
        aliasSections = ensureArray<{ id?: string; title?: string; body?: unknown; items?: unknown }>(
          translations.tGuides(`content.${alias}.sections`, { returnObjects: true }) as unknown,
        );
      }
      if (aliasSections.length > 0) sectionsFb1Raw = aliasSections;
    } catch {
      /* noop: alias not available */
    }
  }
  const sectionsFbEnRaw = sectionsFb1Raw.length > 0
    ? []
    : showTocWhenUnlocalized && !preferManualWhenUnlocalized
      ? ensureArray<{ id?: string; title?: string; body?: unknown; items?: unknown }>(
          translations?.guidesEn?.(`content.${guideKey}.sections`, { returnObjects: true }) as unknown,
        )
      : [];
  const sectionsFb = (sectionsFb1Raw.length > 0 ? sectionsFb1Raw : sectionsFbEnRaw)
    .map((s, idx) => {
      const id = typeof s?.id === "string" && s.id.trim().length > 0 ? s.id.trim() : `s-${idx}`;
      const rawTitle = typeof s?.title === "string" ? s.title.trim() : "";
      const isTitlePlaceholder = (() => {
        if (!rawTitle) return true;
        if (rawTitle === guideKey) return true;
        if (rawTitle.startsWith(`content.${guideKey}.`)) return true;
        return false;
      })();
      const title = isTitlePlaceholder ? "" : rawTitle;
      const bodySrc = s?.body ?? s?.items;
      const body = ensureStringArray(bodySrc);
      if (!title && body.length === 0) return null;
      return { id, title, body };
    })
    .filter(Boolean) as StructuredSection[];

  const derivedFromDays = sectionsFb.length === 0
    ? deriveSectionsFromDays({
        tFb,
        translations,
        guideKey,
      })
    : [];

  let tocItems = tocFbRaw
    .map((it, index) => {
      const label = typeof it?.label === "string" ? it.label.trim() : "";
      const hrefRaw = typeof it?.href === "string" ? it.href.trim() : "";
      const href0 = hrefRaw || `#s-${index}`;
      const href = href0.startsWith("#") ? href0 : `#${href0}`;
      const introLead = introFb[0]?.trim() ?? "";
      const derivedLabel = label || (index === 0 ? introLead : "");
      return derivedLabel ? { href, label: derivedLabel } : null;
    })
    .filter((x): x is TocEntry => x != null);

  // Preserve the FAQs anchor for guides that merge alias FAQs to match test
  // expectations; otherwise omit it from fallback ToC.
  if (tocItems.length > 0 && !shouldMergeAliasFaqs(guideKey)) {
    tocItems = tocItems.filter((it) => it.href !== "#faqs");
  }

  // If ToC items are still empty, synthesize from sections (prefer titles)
  // so fallback-rendered pages expose a minimal navigation landmark.
  if (tocItems.length === 0 && showTocWhenUnlocalized) {
    const fromSections = (sectionsFb.length > 0 ? sectionsFb : [])
      .map((s) => {
        const label = typeof s.title === "string" ? s.title.trim() : "";
        if (!label) return null;
        const href = `#${s.id}`;
        return { href, label } as TocEntry;
      })
      .filter((x): x is TocEntry => x != null);
    if (fromSections.length > 0) {
      tocItems = fromSections;
    }
  }

  // If still empty, synthesize ToC from derived day-plan sections
  if (tocItems.length === 0 && showTocWhenUnlocalized && derivedFromDays.length > 0) {
    for (let i = 0; i < derivedFromDays.length; i += 1) {
      const d = derivedFromDays[i];
      if (!d) continue;
      const label = (d.title || d.id).trim();
      const href = `#${d.id}`;
      if (label.length > 0) tocItems.push({ href, label });
    }
  }

  return {
    intro: introFb,
    introFromEn,
    tocItems,
    sections: sectionsFb,
    derivedFromDays,
  };
}

function deriveSectionsFromDays({
  tFb,
  translations,
  guideKey,
}: {
  tFb: FallbackTranslator | undefined;
  translations: GuidesTranslationsMinimal;
  guideKey: string;
}): StructuredSection[] {
  const sanitizeDayItems = (values: string[], dayKey: string) =>
    values
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(
        (text) =>
          text.length > 0 &&
          text !== `content.${guideKey}.${dayKey}` &&
          text !== `${guideKey}.${dayKey}`,
      );

  const translatorCandidates: Array<
    ((key: string, options?: { returnObjects?: boolean }) => unknown) | undefined
  > = [tFb, translations?.tGuides, translations?.guidesEn];

  try {
    const daysRaw = ensureArray<{ id?: unknown; label?: unknown; items?: unknown }>(
      tFb?.(`content.${guideKey}.days`, { returnObjects: true }),
    );
    if (daysRaw.length > 0) {
      return daysRaw
        .map((d, index) => {
          const idRaw = typeof d?.id === "string" ? d.id.trim() : "";
          const id = idRaw || `day${index + 1}`;
          const title = typeof d?.label === "string" ? d.label.trim() : id;
          const initialBody = ensureStringArray(d?.items);
          const fallbackItems = sanitizeDayItems(initialBody, idRaw || `day${index + 1}`);

          const fallbackDayKeys = new Set<string>();
          if (idRaw) fallbackDayKeys.add(idRaw);
          fallbackDayKeys.add(`day${index + 1}`);

          const resolveFallbackItems = (): string[] => {
            for (const candidate of translatorCandidates) {
              if (typeof candidate !== "function") continue;
              for (const dayKey of fallbackDayKeys) {
                const normalizedKey = dayKey.trim();
                if (!normalizedKey) continue;
                const keysToProbe = [
                  `content.${guideKey}.${normalizedKey}`,
                  `${guideKey}.${normalizedKey}`,
                ];
                for (const translatorKey of keysToProbe) {
                  try {
                    const raw = ensureStringArray(
                      candidate(translatorKey, { returnObjects: true }) as unknown,
                    );
                    const sanitized = sanitizeDayItems(raw, normalizedKey);
                    if (sanitized.length > 0) {
                      return sanitized;
                    }
                  } catch {
                    /* noop */
                  }
                }
              }
            }
            return [] as string[];
          };

          const body = fallbackItems.length > 0 ? fallbackItems : resolveFallbackItems();
          if (title.length === 0 && body.length === 0) return null;
          return { id, title, body } as StructuredSection;
        })
        .filter((x): x is StructuredSection => x != null);
    }

    // Fallback to per-day keys (day1..day7) when present
    const dayKeys = ["day1", "day2", "day3", "day4", "day5", "day6", "day7"];
    return dayKeys
      .map((k) => {
        const rawItems = ensureStringArray(tFb?.(`content.${guideKey}.${k}`, { returnObjects: true }));
        const items = rawItems
          .map((v) => (typeof v === "string" ? v.trim() : String(v)))
          .filter(
            (text) =>
              text.length > 0 &&
              text !== `content.${guideKey}.${k}` &&
              text !== `${guideKey}.${k}`,
          );
        const titleRaw = tFb?.(`content.${guideKey}.${k}Title`) as unknown;
        const raw = typeof titleRaw === "string" ? titleRaw.trim() : "";
        const isPlaceholder = raw === `content.${guideKey}.${k}Title` || raw === guideKey;
        const title = isPlaceholder ? "" : raw;
        const id = k;
        if (items.length === 0 && title.length === 0) return null;
        return { id, title, body: items } as StructuredSection;
      })
      .filter((x): x is StructuredSection => x != null);
  } catch {
    return [] as StructuredSection[];
  }
}
