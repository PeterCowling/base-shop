import i18nApp from "@/i18n";
import { debugGuide } from "@/utils/debug";
import { ensureStringArray } from "@/utils/i18nContent";

import type {
  GuideSeoTemplateContext,
  NormalisedFaq,
  NormalisedSection,
  TocItem,
  Translator,
} from "../types";
import type { FallbackTranslator, StructuredFallback } from "../utils/fallbacks";
import { logStructuredToc } from "../utils/logging";
import { computeStructuredTocItems, normalizeTocForDisplay, resolveFaqTitle } from "../utils/toc";

import StructuredToc from "./StructuredToc";
import {
  getStructuredTocOverride,
  resolveTocTitleText,
  resolveTocTitleProp,
  resolveEnTitleFallback,
  shouldSuppressToc,
} from "./structured-toc";

interface StructuredTocBlockProps {
  itemsBase: TocItem[] | null | undefined;
  context: GuideSeoTemplateContext;
  tGuides: Translator;
  guideKey: GuideSeoTemplateContext["guideKey"];
  sections: NormalisedSection[];
  faqs: NormalisedFaq[];
  buildTocItems?: (ctx: GuideSeoTemplateContext) => TocItem[] | null | undefined;
  renderGenericContent: boolean;
  genericContentOptions?: { showToc?: boolean };
  hasLocalizedContent: boolean;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  fallbackStructured?: StructuredFallback | null;
  preferManualWhenUnlocalized?: boolean;
  suppressUnlocalizedFallback?: boolean;
  fallbackToEnTocTitle?: boolean;
}

export default function StructuredTocBlock({
  itemsBase,
  context,
  tGuides,
  guideKey,
  sections,
  faqs,
  buildTocItems,
  renderGenericContent,
  genericContentOptions: _genericContentOptions,
  hasLocalizedContent,
  showTocWhenUnlocalized,
  suppressTocTitle,
  fallbackStructured,
  preferManualWhenUnlocalized,
  suppressUnlocalizedFallback,
  fallbackToEnTocTitle = true,
}: StructuredTocBlockProps): JSX.Element | null {
  const policy = getStructuredTocOverride(guideKey);
  const baseItems = Array.isArray(itemsBase) ? itemsBase : [];
  const fallbackTranslator =
    fallbackStructured && typeof fallbackStructured === "object"
      ? fallbackStructured.translator
      : undefined;

  // Consolidated suppression checks
  if (
    shouldSuppressToc({
      guideKey,
      hasLocalizedContent,
      preferManualWhenUnlocalized,
      sections,
      tGuides,
      fallbackStructured,
      suppressUnlocalizedFallback,
      buildTocItems,
      context,
      renderGenericContent,
      showTocWhenUnlocalized,
      faqs,
      baseItems,
      policy,
    })
  ) {
    return null;
  }

  const titleText = resolveTocTitleText({
    guideKey,
    tGuides,
    fallbackTranslator,
    fallbackToEnTocTitle,
    policy,
  });

  const tocTitleProp = resolveTocTitleProp(titleText, suppressTocTitle, policy);

  const items = normalizeTocForDisplay(baseItems, {
    guideKey,
    tGuides,
    faqs,
    tipsRaw: tGuides(`content.${guideKey}.tips`, { returnObjects: true }) as unknown,
    buildTocItems,
    translateGuides: context.translateGuides,
    translateGuidesEn: context.translateGuidesEn,
    fallbackTranslator,
  });

  const faqTitleResolved = resolveFaqTitle({
    guideKey,
    tGuides,
    translateGuides: context.translateGuides,
    translateGuidesEn: context.translateGuidesEn,
    fallbackTranslator,
  });

  try {
    debugGuide("Render structured ToC", { guideKey, titleText, itemsCount: items?.length, items });
    if (!hasLocalizedContent) {
      logStructuredToc("[StructuredTocBlock]", guideKey, {
        base: baseItems?.length ?? 0,
        items: items?.length ?? 0,
      });
    }
  } catch {
    /* noop: debug only */
  }

  // Only short-circuit when localized content exists but no items resolved.
  if (hasLocalizedContent && (!items || items.length === 0)) return null;

  return (
    <>
      {/* Localized ToC */}
      {hasLocalizedContent ? (
        <LocalizedToc
          items={items}
          sections={sections}
          suppressTocTitle={suppressTocTitle}
          tocTitleProp={tocTitleProp}
          guideKey={guideKey}
          policy={policy}
        />
      ) : null}

      {/* Minimal unlocalized ToC */}
      <MinimalUnlocalizedToc
        hasLocalizedContent={hasLocalizedContent}
        showTocWhenUnlocalized={showTocWhenUnlocalized}
        preferManualWhenUnlocalized={preferManualWhenUnlocalized}
        fallbackStructured={fallbackStructured}
        policy={policy}
        items={items}
        sections={sections}
        suppressTocTitle={suppressTocTitle}
        tocTitleProp={tocTitleProp}
        guideKey={guideKey}
        buildTocItems={buildTocItems}
        context={context}
        faqs={faqs}
        tGuides={tGuides}
        fallbackTranslator={fallbackTranslator}
      />

      {/* Minimal localized content */}
      <MinimalLocalizedContent
        hasLocalizedContent={hasLocalizedContent}
        renderGenericContent={renderGenericContent}
        policy={policy}
        buildTocItems={buildTocItems}
        context={context}
        sections={sections}
        guideKey={guideKey}
        tGuides={tGuides}
        faqs={faqs}
        faqTitleResolved={faqTitleResolved}
      />

      {/* Minimal unlocalized intro */}
      <MinimalUnlocalizedIntro
        hasLocalizedContent={hasLocalizedContent}
        fallbackStructured={fallbackStructured}
        preferManualWhenUnlocalized={preferManualWhenUnlocalized}
        policy={policy}
        guideKey={guideKey}
      />

      {/* Minimal unlocalized sections */}
      <MinimalUnlocalizedSections
        hasLocalizedContent={hasLocalizedContent}
        showTocWhenUnlocalized={showTocWhenUnlocalized}
        preferManualWhenUnlocalized={preferManualWhenUnlocalized}
        fallbackStructured={fallbackStructured}
        buildTocItems={buildTocItems}
        context={context}
        policy={policy}
        sections={sections}
        guideKey={guideKey}
      />
    </>
  );
}

// Sub-components extracted for readability

function LocalizedToc({
  items,
  sections,
  suppressTocTitle,
  tocTitleProp,
  guideKey,
  policy,
}: {
  items: TocItem[];
  sections: NormalisedSection[];
  suppressTocTitle?: boolean;
  tocTitleProp: string | undefined;
  guideKey: string;
  policy: ReturnType<typeof getStructuredTocOverride>;
}) {
  const props: { items: TocItem[]; sectionsPresent?: boolean; title?: string } = {
    items: items,
    sectionsPresent: Array.isArray(sections) && sections.length > 0,
  };

  if (!suppressTocTitle && typeof tocTitleProp === "string" && tocTitleProp.trim().length > 0) {
    props.title = tocTitleProp;
  } else if (policy.forceEnTocTitleFallback) {
    const enTitle = resolveEnTitleFallback(guideKey);
    if (enTitle) props.title = enTitle;
  }

  return <StructuredToc {...props} />;
}

function MinimalUnlocalizedToc({
  hasLocalizedContent,
  showTocWhenUnlocalized,
  preferManualWhenUnlocalized,
  fallbackStructured,
  policy,
  items,
  sections,
  suppressTocTitle,
  tocTitleProp,
  guideKey,
  buildTocItems,
  context,
  faqs,
  tGuides,
  fallbackTranslator,
}: {
  hasLocalizedContent: boolean;
  showTocWhenUnlocalized: boolean;
  preferManualWhenUnlocalized?: boolean;
  fallbackStructured?: StructuredFallback | null;
  policy: ReturnType<typeof getStructuredTocOverride>;
  items: TocItem[];
  sections: NormalisedSection[];
  suppressTocTitle?: boolean;
  tocTitleProp: string | undefined;
  guideKey: string;
  buildTocItems?: (ctx: GuideSeoTemplateContext) => TocItem[] | null | undefined;
  context: GuideSeoTemplateContext;
  faqs: NormalisedFaq[];
  tGuides: Translator;
  fallbackTranslator: FallbackTranslator | undefined;
}) {
  if (hasLocalizedContent) return null;
  if (!showTocWhenUnlocalized) return null;
  if (preferManualWhenUnlocalized) return null;
  if (policy.suppressMinimalUnlocalizedToc) return null;
  if (fallbackStructured) return null;

  const props: { items: TocItem[]; sectionsPresent?: boolean; title?: string } = {
    items: items,
    sectionsPresent: Array.isArray(sections) && sections.length > 0,
  };

  if (!suppressTocTitle && typeof tocTitleProp === "string" && tocTitleProp.trim().length > 0) {
    props.title = tocTitleProp;
  } else if (policy.forceEnTocTitleFallback) {
    const enTitle = resolveEnTitleFallback(guideKey);
    if (enTitle) props.title = enTitle;
  }

  let itemsEff = items;
  if (typeof buildTocItems === "function" && itemsEff.length === 0) {
    itemsEff = computeStructuredTocItems({
      guideKey,
      tGuides,
      baseToc: [],
      contextToc: [],
      sections,
      faqs,
      hasLocalizedContent: false,
      suppressUnlocalizedFallback: false,
      customProvided: false,
      translateGuides: context.translateGuides,
      translateGuidesEn: context.translateGuidesEn,
      fallbackTranslator,
    });
  }

  if (itemsEff.length === 0) return null;

  logStructuredToc("[StructuredTocBlock:minimal-toc]", guideKey, { items: itemsEff.length });
  return <StructuredToc {...props} items={itemsEff} />;
}

function MinimalLocalizedContent({
  hasLocalizedContent,
  renderGenericContent,
  policy,
  buildTocItems,
  context,
  sections,
  guideKey,
  tGuides,
  faqTitleResolved,
}: {
  hasLocalizedContent: boolean;
  renderGenericContent: boolean;
  policy: ReturnType<typeof getStructuredTocOverride>;
  buildTocItems?: (ctx: GuideSeoTemplateContext) => TocItem[] | null | undefined;
  context: GuideSeoTemplateContext;
  sections: NormalisedSection[];
  guideKey: string;
  tGuides: Translator;
  faqs: NormalisedFaq[];
  faqTitleResolved: ReturnType<typeof resolveFaqTitle>;
}) {
  const allowMinimalWithGeneric = policy.allowMinimalWithGenericContent && hasLocalizedContent;
  if (renderGenericContent && !allowMinimalWithGeneric) return null;
  if (policy.suppressMinimalLocalizedContent) return null;
  if (
    typeof buildTocItems === "function" &&
    Array.isArray(context?.toc) &&
    context.toc.length > 0
  ) {
    return null;
  }
  if (!hasLocalizedContent) return null;

  const introTrimmed = (Array.isArray(context?.intro) ? context.intro : [])
    .map((p) => (typeof p === "string" ? p.trim() : String(p)))
    .filter((p) => p.length > 0);

  const meaningfulSections = (Array.isArray(sections) ? sections : []).filter(
    (s) => Array.isArray(s?.body) && s.body.length > 0,
  );

  const sectionsForDisplay = meaningfulSections.filter((section) => {
    const pattern = policy.sectionIdFilterPattern;
    if (!pattern) return true;
    const id = typeof section?.id === "string" ? section.id.trim() : "";
    if (id.length === 0) return true;
    return !pattern.test(id);
  });

  const tipsList = (() => {
    try {
      const raw = tGuides(`content.${guideKey}.tips`, { returnObjects: true }) as unknown;
      return Array.isArray(raw)
        ? (raw as unknown[])
            .map((v) => (typeof v === "string" ? v.trim() : String(v)))
            .filter((v) => v.length > 0)
        : [];
    } catch {
      return [] as string[];
    }
  })();

  if (introTrimmed.length === 0 && meaningfulSections.length === 0) return null;

  logStructuredToc("[StructuredTocBlock:minimal-localized]", guideKey);

  return (
    <div className="space-y-8">
      {introTrimmed.length > 0 ? (
        <div className="space-y-4">
          {introTrimmed.map((p, idx) => (
            <p key={`li-${idx}`}>{p}</p>
          ))}
        </div>
      ) : null}

      {sectionsForDisplay.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-28 space-y-4">
          {(() => {
            const title = typeof s.title === "string" ? s.title.trim() : "";
            return title.length > 0 ? (
              <h2 className="text-pretty text-2xl font-semibold tracking-tight text-brand-heading">
                {title}
              </h2>
            ) : null;
          })()}
          {s.body
            .map((b) => (typeof b === "string" ? b.trim() : String(b)))
            .filter((text: string) => text.length > 0)
            .map((text: string, i: number) => (
              <p key={`lb-${i}`}>{text}</p>
            ))}
        </section>
      ))}

      <TipsSectionBlock guideKey={guideKey} tGuides={tGuides} tipsList={tipsList} />

      <FaqSectionBlock guideKey={guideKey} tGuides={tGuides} faqTitleResolved={faqTitleResolved} />
    </div>
  );
}

function TipsSectionBlock({
  guideKey,
  tGuides,
  tipsList,
}: {
  guideKey: string;
  tGuides: Translator;
  tipsList: string[];
}) {
  if (tipsList.length === 0) return null;

  const heading = (() => {
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
      const fb = tGuides("labels.tipsHeading") as string;
      if (typeof fb === "string") {
        const v = fb.trim();
        if (v.length > 0 && v !== "labels.tipsHeading") return v;
      }
    } catch {
      /* noop */
    }
    return null;
  })();

  return (
    <section id="tips" className="space-y-3">
      {heading ? (
        <h2 className="text-pretty text-2xl font-semibold tracking-tight text-brand-heading">
          {heading}
        </h2>
      ) : null}
      {tipsList.map((t, i) => (
        <p key={`tip-${i}`}>{t}</p>
      ))}
    </section>
  );
}

function FaqSectionBlock({
  guideKey,
  tGuides,
  faqTitleResolved,
}: {
  guideKey: string;
  tGuides: Translator;
  faqTitleResolved: ReturnType<typeof resolveFaqTitle>;
}) {
  try {
    const rawA = tGuides(`content.${guideKey}.faqs`, { returnObjects: true }) as unknown;
    const rawB = tGuides(`content.${guideKey}.faq`, { returnObjects: true }) as unknown;

    const flatten = (input: unknown): Array<Record<string, unknown>> => {
      const out: Array<Record<string, unknown>> = [];
      const walk = (val: unknown) => {
        if (Array.isArray(val)) {
          for (const v of val) walk(v);
        } else if (val && typeof val === "object") {
          out.push(val as Record<string, unknown>);
        }
      };
      walk(input);
      return out;
    };

    const merged = [...flatten(rawA), ...flatten(rawB)];
    const itemsRaw = merged
      .map((f) => {
        const questionSource =
          typeof f["q"] === "string"
            ? f["q"]
            : typeof f["question"] === "string"
              ? f["question"]
              : "";
        const q = questionSource.trim();
        const answerSource = f["a"] ?? f["answer"];
        const answers = Array.isArray(answerSource)
          ? answerSource
              .map((value) => (typeof value === "string" ? value.trim() : String(value)))
              .filter((value) => value.length > 0)
          : typeof answerSource === "string"
            ? [answerSource.trim()].filter((value) => value.length > 0)
            : [];
        return q && answers.length > 0 ? { q, a: answers } : null;
      })
      .filter((entry): entry is { q: string; a: string[] } => entry != null);

    // Deduplicate by q + answers signature
    const seen = new Set<string>();
    const items = itemsRaw.filter((it) => {
      const key = `${it.q}::${it.a.join("\u0001")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (items.length === 0) return null;

    const faqsHeading = (() => {
      if (faqTitleResolved.suppressed && !faqTitleResolved.title) return "";
      const resolved =
        typeof faqTitleResolved.title === "string" ? faqTitleResolved.title.trim() : "";
      return resolved;
    })();

    return (
      <section id="faqs" className="space-y-3">
        {faqsHeading.trim().length > 0 ? (
          <h2 className="text-pretty text-2xl font-semibold tracking-tight text-brand-heading">
            {faqsHeading}
          </h2>
        ) : null}
        {items.map((f, idx) => (
          <details key={`faq-${idx}`}>
            <summary role="button" className="font-medium">
              {f.q}
            </summary>
            {f.a.map((ans, i) => (
              <p key={`faq-${idx}-${i}`}>{ans}</p>
            ))}
          </details>
        ))}
      </section>
    );
  } catch {
    return null;
  }
}

function MinimalUnlocalizedIntro({
  hasLocalizedContent,
  fallbackStructured,
  preferManualWhenUnlocalized,
  policy,
  guideKey,
}: {
  hasLocalizedContent: boolean;
  fallbackStructured?: StructuredFallback | null;
  preferManualWhenUnlocalized?: boolean;
  policy: ReturnType<typeof getStructuredTocOverride>;
  guideKey: string;
}) {
  if (hasLocalizedContent) return null;
  if (fallbackStructured) return null;
  if (policy.suppressMinimalUnlocalizedIntro) return null;
  if (preferManualWhenUnlocalized) return null;

  let introFb: string[] = [];
  try {
    const en = i18nApp?.getFixedT?.("en", "guides");
    if (typeof en === "function") {
      const raw = en(`content.${guideKey}.intro`, { returnObjects: true }) as unknown;
      const arr = Array.isArray(raw) ? ensureStringArray(raw) : [];
      if (arr.length > 0) introFb = arr;
    }
  } catch {
    /* ignore */
  }

  const introTrimmed = introFb
    .map((p) => (typeof p === "string" ? p.trim() : String(p)))
    .filter((p) => p.length > 0);

  if (introTrimmed.length === 0) return null;

  logStructuredToc("[StructuredTocBlock:minimal-unlocalized-intro]", guideKey);

  return (
    <div className="space-y-4">
      {introTrimmed.map((p, idx) => (
        <p key={idx}>{p}</p>
      ))}
    </div>
  );
}

function MinimalUnlocalizedSections({
  hasLocalizedContent,
  showTocWhenUnlocalized,
  preferManualWhenUnlocalized,
  fallbackStructured,
  buildTocItems,
  context,
  policy,
  sections,
  guideKey,
}: {
  hasLocalizedContent: boolean;
  showTocWhenUnlocalized: boolean;
  preferManualWhenUnlocalized?: boolean;
  fallbackStructured?: StructuredFallback | null;
  buildTocItems?: (ctx: GuideSeoTemplateContext) => TocItem[] | null | undefined;
  context: GuideSeoTemplateContext;
  policy: ReturnType<typeof getStructuredTocOverride>;
  sections: NormalisedSection[];
  guideKey: string;
}) {
  if (hasLocalizedContent) return null;
  if (!showTocWhenUnlocalized) return null;
  if (preferManualWhenUnlocalized) return null;
  if (fallbackStructured) return null;
  if (
    typeof buildTocItems === "function" &&
    Array.isArray(context?.toc) &&
    context.toc.length > 0
  ) {
    return null;
  }
  if (policy.suppressMinimalUnlocalizedSections) return null;

  const meaningful = (Array.isArray(sections) ? sections : []).filter(
    (s) => Array.isArray(s?.body) && s.body.length > 0,
  );

  if (meaningful.length === 0) return null;

  try {
    debugGuide("Render minimal fallback sections", {
      count: meaningful.length,
      keys: meaningful.map((s) => s.id),
    });
  } catch {
    /* noop: debug only */
  }

  logStructuredToc("[StructuredTocBlock:minimal-unlocalized-sections]", guideKey);

  return (
    <div className="space-y-8">
      {meaningful.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-28 space-y-4">
          {(() => {
            const title = typeof s.title === "string" ? s.title.trim() : "";
            return title.length > 0 ? (
              <h2 className="text-pretty text-2xl font-semibold tracking-tight text-brand-heading">
                {title}
              </h2>
            ) : null;
          })()}
          {s.body
            .map((b) => (typeof b === "string" ? b.trim() : String(b)))
            .filter((text: string) => text.length > 0)
            .map((text: string, i: number) => (
              <p key={i}>{text}</p>
            ))}
        </section>
      ))}
    </div>
  );
}
