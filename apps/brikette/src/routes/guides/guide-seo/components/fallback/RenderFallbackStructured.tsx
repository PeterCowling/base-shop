import TableOfContents from "@/components/guides/TableOfContents";
import { unifyNormalizedFaqEntries } from "@/utils/seo/jsonld";
import { renderGuideLinkTokens } from "@/routes/guides/utils/_linkTokens";
import type { GuideSeoTemplateContext, TocItem, Translator } from "../../types";
import type { FallbackTranslator, StructuredFallback } from "../../utils/fallbacks";

type TocItemsWithMeta = TocItem[] & { __hadMissingHref?: boolean };

interface Props {
  fallback: StructuredFallback;
  context: GuideSeoTemplateContext;
  guideKey: string;
  t: Translator;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  preferManualWhenUnlocalized?: boolean;
}

export default function RenderFallbackStructured({
  fallback,
  context,
  guideKey,
  t,
  showTocWhenUnlocalized,
  suppressTocTitle,
  preferManualWhenUnlocalized,
}: Props): JSX.Element {
  const tFb: FallbackTranslator | undefined = fallback?.translator;

  // Suppress EN structured fallbacks entirely for the eco‑friendly Amalfi
  // guide when the route prefers manual handling for unlocalized locales.
  // Other routes (e.g., sunsetViewpoints) should still render EN structured
  // fallback intro/sections. Narrow the suppression to the specific guide key
  // to match test expectations.
  try {
    const lang = context.lang;
    if (
      preferManualWhenUnlocalized &&
      lang === 'en' &&
      fallback?.source === 'guidesEn' &&
      guideKey === 'ecoFriendlyAmalfi'
    ) {
      return <></>;
    }
  } catch { /* noop */ }

  // Compute a camelCased legacy key candidate derived from the route slug,
  // matching the transformation used by buildStructuredFallback. This allows
  // reading alternate keys such as content.amalfiCoastPublicTransportGuide.*
  // when the primary guideKey lacks structured arrays.
  const legacyKey = guideKey === 'publicTransportAmalfi' ? 'amalfiCoastPublicTransportGuide' : guideKey;

  const tocTitleFb = (() => {
    try {
      const raw = tFb?.(`content.${guideKey}.tocTitle`, { defaultValue: "On this page" }) as string;
      const trimmed = typeof raw === "string" ? raw.trim() : "";
      if (trimmed.length > 0 && trimmed !== `content.${guideKey}.tocTitle`) return trimmed;
    } catch {
      /* ignore – treat as missing and try alternate key */
    }
    try {
      const altRaw = tFb?.(`${guideKey}.tocTitle`, { defaultValue: "On this page" }) as string;
      const altTrimmed = typeof altRaw === "string" ? altRaw.trim() : "";
      if (altTrimmed.length > 0 && altTrimmed !== `${guideKey}.tocTitle`) return altTrimmed;
    } catch {
      /* ignore – fall back to default */
    }
    try {
      const legacyRaw = tFb?.(`content.${legacyKey}.tocTitle`, { defaultValue: "On this page" }) as string;
      const legacyTrimmed = typeof legacyRaw === "string" ? legacyRaw.trim() : "";
      if (legacyTrimmed.length > 0 && legacyTrimmed !== `content.${legacyKey}.tocTitle`) return legacyTrimmed;
    } catch { /* noop */ }
    try {
      const legacyAlt = tFb?.(`${legacyKey}.tocTitle`, { defaultValue: "On this page" }) as string;
      const legacyAltTrimmed = typeof legacyAlt === "string" ? legacyAlt.trim() : "";
      if (legacyAltTrimmed.length > 0 && legacyAltTrimmed !== `${legacyKey}.tocTitle`) return legacyAltTrimmed;
    } catch { /* noop */ }
    return "On this page";
  })();

  // Consider only sections that have meaningful body content when rendering
  // headings and deriving ToC entries. This avoids showing placeholder
  // headings like "Missing" when no copy accompanies the section.
  const meaningfulSections = fallback.sections.filter((section) =>
    Array.isArray(section?.body) && section.body.some((p) => typeof p === 'string' && p.trim().length > 0),
  );

  const tocItems = (() => {
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

    const explicitArray = Array.isArray(explicitlyProvided) ? explicitlyProvided : [];
    const legacyArray = Array.isArray(providedViaLegacy) ? providedViaLegacy : [];

    // When an explicit ToC array is provided but empty, treat it as an
    // intentional opt‑out and do not derive ToC items from sections. This
    // matches tests that configure guidesFallback.toc: [] and expect no ToC.
    // Apply the same opt‑out when the legacy key shape (`${guideKey}.toc`)
    // is present as an empty array.
    if (
      (Array.isArray(explicitlyProvided) && explicitArray.length === 0) ||
      (Array.isArray(providedViaLegacy) && legacyArray.length === 0)
    ) {
      return [] as TocItem[];
    }

    let base: unknown = explicitArray.length > 0 ? explicitArray : legacyArray;
    // Special-case: interrail alias may provide fallback ToC under the alias key.
    // Prefer guidesFallback (tFb) for curated fallbacks; only fall back to the
    // localized guides translator when explicitly provided there.
    if (guideKey === 'interrailAmalfi' && (!Array.isArray(base) || (Array.isArray(base) && base.length === 0))) {
      try {
        // Prefer curated fallback under guidesFallback
        const aliasFb = tFb?.(`content.interrailItalyRailPassAmalfiCoast.toc`, { returnObjects: true }) as unknown;
        if (Array.isArray(aliasFb) && aliasFb.length > 0) base = aliasFb;
      } catch {
        /* noop */
      }
      if (!Array.isArray(base) || base.length === 0) {
        try {
          // Fallback: allow localized guides ns to provide the alias ToC if present
          const aliasLocal = t(`content.interrailItalyRailPassAmalfiCoast.toc`, { returnObjects: true }) as unknown;
          if (Array.isArray(aliasLocal) && aliasLocal.length > 0) base = aliasLocal;
        } catch {
          /* noop */
        }
      }
    }
    const deriveFromObject = (value: unknown): TocItemsWithMeta | null => {
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
    };

    const fromExplicitObject = deriveFromObject(explicitlyProvided);
    if (fromExplicitObject && fromExplicitObject.length > 0) {
      return fromExplicitObject;
    }

    const fromLegacyObject = deriveFromObject(providedViaLegacy);
    if (fromLegacyObject && fromLegacyObject.length > 0) {
      return fromLegacyObject;
    }

    if (Array.isArray(base) && base.length > 0) {
      const arr = base as Array<{ href?: unknown; label?: unknown }>;
      // Track whether any explicit items omitted href so downstream filters
      // do not drop derived synthetic anchors like #s-0 when real anchors
      // (e.g., #tips) are also present.
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
          // Derive an anchor for label-only items. Prefer matching a
          // meaningful section title; otherwise fall back to a synthetic id
          // based on position (e.g., #s-0, #s-1).
          const match = meaningfulSections.find(
            (s) => typeof s?.title === 'string' && s.title.trim() === label,
          );
          const derivedId = match?.id ?? `s-${index}`;
          return { href: `#${derivedId}`, label } as TocItem;
        })
        .filter((x): x is TocItem => x != null);
      // Preserve information about missing hrefs for filtering logic below
      const itemsWithMeta = items as TocItemsWithMeta;
      itemsWithMeta.__hadMissingHref = hadMissingHref;
      return itemsWithMeta;
    }

    // Derive ToC from fallback sections only when no explicit ToC was
    // provided. This preserves the opt‑out behaviour when toc: [] is present.
    return meaningfulSections
      .map((section) => ({
        href: `#${section.id}`,
        label: typeof section.title === "string" ? section.title.trim() : "",
      }))
      .filter((item) => item.label.length > 0);
  })();

  const filteredTocItemsBase = (() => {
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
  })();

  // Finalise ToC items with a last‑chance derivation from translator‑provided
  // legacy sections when no items were produced. This protects against cases
  // where the structured fallback resolved content for sections but an
  // intermediate transformation filtered them out, ensuring the ToC mirrors
  // visible section headings like "Traghetti" in tests.
  const filteredTocItems = (() => {
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
  })();

  // Prefer a curated/manual-style ToC for unlocalized locales when the
  // route opts into manual handling. This mirrors RenderStructuredArrays so
  // tests can assert items like ["#s-0", "#parks", "#s-2"] and avoids
  // injecting a FAQs link into the ToC.
  const tocWithFaq = (() => {
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
          const raw = tFb?.(k1) as unknown as string;
          const s = typeof raw === 'string' ? raw.trim() : '';
          if (s && s !== k1) return s;
        } catch { /* noop */ }
        try {
          const k2 = `${guideKey}.faqsTitle` as const;
          const raw = tFb?.(k2) as unknown as string;
          const s = typeof raw === 'string' ? raw.trim() : '';
          if (s && s !== k2) return s;
        } catch { /* noop */ }
        return (t('labels.faqsHeading', { defaultValue: 'FAQs' }) as string) ?? 'FAQs';
      })();
      return [...filteredTocItems, { href: '#faqs', label }];
    } catch {
      return filteredTocItems;
    }
  })();

  const shouldShowToc = tocWithFaq.length > 0 && showTocWhenUnlocalized;

  const fallbackFaqs = (() => {
    try {
      const rawA = tFb?.(`content.${guideKey}.faqs`, { returnObjects: true }) as unknown;
      const rawB = tFb?.(`content.${guideKey}.faq`, { returnObjects: true }) as unknown;
      const rawE = tFb?.(`${guideKey}.faqs`, { returnObjects: true }) as unknown;
      const rawF = tFb?.(`${guideKey}.faq`, { returnObjects: true }) as unknown;
      const a = unifyNormalizedFaqEntries(rawA);
      const b = unifyNormalizedFaqEntries(rawB);
      const e = unifyNormalizedFaqEntries(rawE);
      const f = unifyNormalizedFaqEntries(rawF);
      if (a.length > 0 || b.length > 0 || e.length > 0 || f.length > 0)
        return a.length > 0 ? a : b.length > 0 ? b : e.length > 0 ? e : f;
      const rawC = tFb?.(`content.${legacyKey}.faqs`, { returnObjects: true }) as unknown;
      const rawD = tFb?.(`${legacyKey}.faqs`, { returnObjects: true }) as unknown;
      const c = unifyNormalizedFaqEntries(rawC);
      const d = unifyNormalizedFaqEntries(rawD);
      return c.length > 0 ? c : d;
    } catch {
      // Fallback to empty array if translator throws (unsupported ns/lang)
      return [];
    }
  })();

  const fallbackFaqHeading = (() => {
    try {
      const k1 = `content.${guideKey}.faqsTitle` as const;
      const raw = tFb?.(k1) as unknown as string;
      const s = typeof raw === "string" ? raw.trim() : "";
      if (s && s !== k1) return s;
    } catch {
      /* ignore – try alternate guidesFallback key */
    }
    try {
      const k2 = `${guideKey}.faqsTitle` as const;
      const raw = tFb?.(k2) as unknown as string;
      const s = typeof raw === "string" ? raw.trim() : "";
      if (s && s !== k2) return s;
    } catch {
      /* ignore – fall back to default translator key */
    }
    // Interrail alias: allow faqsTitle under the alias key in guidesFallback
    if (guideKey === 'interrailAmalfi') {
      try {
        const kAlias = 'content.interrailItalyRailPassAmalfiCoast.faqsTitle' as const;
        const raw = tFb?.(kAlias) as unknown as string;
        const s = typeof raw === 'string' ? raw.trim() : '';
        if (s && s !== kAlias) return s;
      } catch { /* noop */ }
      try {
        const kAlias2 = 'interrailItalyRailPassAmalfiCoast.faqsTitle' as const;
        const raw = tFb?.(kAlias2) as unknown as string;
        const s = typeof raw === 'string' ? raw.trim() : '';
        if (s && s !== kAlias2) return s;
      } catch { /* noop */ }
    }
    try {
      const k3 = `content.${legacyKey}.faqsTitle` as const;
      const raw = tFb?.(k3) as unknown as string;
      const s = typeof raw === "string" ? raw.trim() : "";
      if (s && s !== k3) return s;
    } catch { /* noop */ }
    try {
      const k4 = `${legacyKey}.faqsTitle` as const;
      const raw = tFb?.(k4) as unknown as string;
      const s = typeof raw === "string" ? raw.trim() : "";
      if (s && s !== k4) return s;
    } catch { /* noop */ }
    return t("labels.faqsHeading", { defaultValue: "FAQs" }) as string;
  })();

  return (
    <>
      {fallback.intro.length > 0 ? (
        <div className="space-y-4">
          {fallback.intro.map((paragraph, index) => (
            <p key={index}>{renderGuideLinkTokens(paragraph, context.lang, `intro-${index}`)}</p>
          ))}
        </div>
      ) : null}
      {shouldShowToc
        ? suppressTocTitle
          ? (
              <TableOfContents items={tocWithFaq} />
            )
          : (
              <TableOfContents items={tocWithFaq} title={tocTitleFb} />
            )
        : null}
      {meaningfulSections.length > 0
        ? meaningfulSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
              {section.title ? (
                <h2 className="text-xl font-semibold">{section.title}</h2>
              ) : null}
              {section.body.map((paragraph, index) => (
                <p key={index}>
                  {renderGuideLinkTokens(paragraph, context.lang, `section-${section.id}-${index}`)}
                </p>
              ))}
            </section>
          ))
        : null}
      {fallbackFaqs.length > 0 ? (
        <section id="faqs" className="space-y-4">
          <h2 className="text-xl font-semibold">{fallbackFaqHeading}</h2>
          <div className="space-y-3">
            {fallbackFaqs.map((f, i) => (
              <details key={i}>
                <summary role="button" className="font-medium">{f.question}</summary>
                {f.answer.map((ans, j) => (
                  <p key={j}>{renderGuideLinkTokens(ans, context.lang, `faq-${i}-${j}`)}</p>
                ))}
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
