import i18nApp from "@/i18n";
import { debugGuide } from "@/utils/debug";
import { ensureStringArray } from "@/utils/i18nContent";

import type {
  GuideSeoTemplateContext,
  NormalisedFaq,
  NormalisedSection,
  TocItem,
  Translator,
} from "../../types";
import type { StructuredFallback } from "../../utils/fallbacks";
import { logStructuredToc } from "../../utils/logging";
import { type resolveFaqTitle } from "../../utils/toc";

import { type getStructuredTocOverride } from "./index";
import { FaqSectionBlock } from "./StructuredTocFaqSection";

export function MinimalLocalizedContent({
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

export function TipsSectionBlock({
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


export function MinimalUnlocalizedIntro({
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

export function MinimalUnlocalizedSections({
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
