import { Children } from "react";

import TableOfContents from "@/components/guides/TableOfContents";
import { getContentAlias, shouldMergeAliasFaqs } from "@/config/guide-overrides";
import type { AppLanguage } from "@/i18n.config";
import { renderBodyBlocks, renderGuideLinkTokens } from "@/routes/guides/utils/linkTokens";
import { debugGuide } from "@/utils/debug";

import type { Translator } from "../../types";
import type { FallbackTranslator } from "../../utils/fallbacks";

import {
  type GuidesTranslationsMinimal,
  resolveStructuredArrayContent,
  type TocEntry,
} from "./structuredArraysContent";
import { resolveStructuredArrayFaqHeading, resolveStructuredArrayFaqs } from "./structuredArraysFaqs";

interface RenderContext {
  toc?: TocEntry[] | undefined;
  hasLocalizedContent?: unknown;
  intro?: unknown;
  sections?: unknown;
  lang?: string;
}

interface Props {
  tFb: FallbackTranslator | undefined;
  translations: GuidesTranslationsMinimal;
  guideKey: string;
  t: Translator;
  showTocWhenUnlocalized: boolean;
  suppressTocTitle?: boolean;
  context: RenderContext;
  /**
   * When true, prefer curated/manual fallbacks over EN structured content for
   * unlocalized locales. Do not pull EN intro/sections and do not suppress the
   * fallback ToC based on context.toc (which may be derived from EN data).
   */
  preferManualWhenUnlocalized?: boolean;
  /** When true, manual structured fallback content has already been rendered. */
  manualStructuredFallbackRendered?: boolean;
}

/** Fallback rendering from structured arrays provided by tFb */
export default function RenderStructuredArrays({
  tFb,
  translations,
  guideKey,
  t,
  showTocWhenUnlocalized,
  suppressTocTitle,
  context,
  preferManualWhenUnlocalized,
  manualStructuredFallbackRendered,
}: Props): JSX.Element | null {
  // Never render structured fallback arrays when the page already has localized
  // structured intro and sections; avoid incidental calls into fallback
  // translators (which tests assert should not occur). Allow fallback rendering
  // when the localized page only provides FAQs or is missing either intro or
  // sections.
  try {
    const hasLocal = Boolean(context?.hasLocalizedContent);
    if (hasLocal) {
      const introLocalCandidate = context?.intro;
      const introLocal = Array.isArray(introLocalCandidate) ? introLocalCandidate : [];
      const sectionsCandidate = context?.sections;
      const sectionsLocal = Array.isArray(sectionsCandidate) ? sectionsCandidate : [];
      const hasIntro = introLocal.length > 0;
      const hasSections = sectionsLocal.some((section) => {
        if (!section || typeof section !== "object") return false;
        const body = (section as { body?: unknown }).body;
        return Array.isArray(body) && body.length > 0;
      });
      if (hasIntro && hasSections) return null;
    }
  } catch {
    // continue; context may be partially mocked
  }
  try {
    const alias = getContentAlias(guideKey);
    const { intro, introFromEn, tocItems: baseTocItems, sections, derivedFromDays } =
      resolveStructuredArrayContent({
        tFb,
        translations,
        guideKey,
        alias,
        showTocWhenUnlocalized,
        preferManualWhenUnlocalized,
      });

    const tocItems = shouldMergeAliasFaqs(guideKey)
      ? baseTocItems
      : baseTocItems.filter((it) => it.href !== "#faqs");

    const faqsCombined = resolveStructuredArrayFaqs({
      tFb,
      translations,
      guideKey,
      alias,
    });

    const finalSections = sections.length > 0 ? sections : derivedFromDays;
    const skipStructuredBlocks = Boolean(manualStructuredFallbackRendered);
    const contextHasToc = Array.isArray(context.toc) && context.toc.length > 0;
    const allowDespiteContext = Boolean(preferManualWhenUnlocalized);
    const shouldRenderToc =
      !skipStructuredBlocks &&
      tocItems.length > 0 &&
      showTocWhenUnlocalized &&
      (!contextHasToc || allowDespiteContext);
    const showIntro = !skipStructuredBlocks && intro.length > 0 && !introFromEn;
    const showSections = !skipStructuredBlocks && finalSections.length > 0;
    const hasAny = showIntro || showSections || shouldRenderToc || faqsCombined.length > 0;
    try {
      debugGuide(
        "GuideSeoTemplate fallback", // i18n-exempt -- DEV-000 [ttl=2099-12-31] Debug label
        {
          guideKey,
          sectionsCount: sections.length,
          tocCount: tocItems.length,
        },
      );
    } catch {
      /* noop: debug only */
    }
    if (!hasAny) return null;

    const tocTitle = (() => {
      try {
        const primary = t(`content.${guideKey}.toc.title`) as string;
        if (typeof primary === "string") {
          const v = primary.trim();
          if (v && v !== `content.${guideKey}.toc.title`) return v;
        }
      } catch {
        /* noop: translator may not have key */
      }
      try {
        const legacy = t(`content.${guideKey}.toc.onThisPage`, "On this page") as string;
        if (typeof legacy === "string") {
          const v = legacy.trim();
          if (v.length > 0 && v !== `content.${guideKey}.toc.onThisPage`) return v;
        }
      } catch {
        /* noop */
      }
      // Fallback to labels:onThisPage to avoid hardcoded copy
      return (t("labels.onThisPage", { defaultValue: "On this page" }) as string) ?? "On this page";
    })();

    const lang = (typeof context?.lang === "string" ? context.lang : "en") as AppLanguage;

    return (
      <>
        {/* Avoid duplicating EN fallback intro that StructuredTocBlock may already render */}
        {showIntro ? (
          <div className="space-y-4">
            {intro.map((p, idx) => (
              <p key={idx}>{renderGuideLinkTokens(p, lang, `intro-${idx}`)}</p>
            ))}
          </div>
        ) : null}
        {shouldRenderToc
          ? suppressTocTitle
            ? (
                <TableOfContents items={tocItems} />
              )
            : (
                <TableOfContents items={tocItems} title={tocTitle} />
              )
          : null}
        {!skipStructuredBlocks
          ? Children.toArray(
              finalSections.map((s, index) => (
                <section key={`${s.id}-${index}`} id={s.id} className="scroll-mt-28 space-y-4">
                  {s.title ? <h2 className="text-xl font-semibold">{s.title}</h2> : null}
                  {renderBodyBlocks(s.body, lang, `section-${s.id}`)}
                </section>
              )),
            )
          : null}
        {faqsCombined.length > 0 ? (
          <section id="faqs" className="space-y-4">
            {(() => {
              const heading = resolveStructuredArrayFaqHeading({
                tFb,
                translations,
                t,
                guideKey,
                alias,
              });
              return heading ? <h2 className="text-xl font-semibold">{heading}</h2> : null;
            })()}
            <div className="space-y-3">
              {faqsCombined.map((f, i) => (
                <details key={i}>
                  <summary role="button" className="font-medium">{f.q}</summary>
                  {renderBodyBlocks(f.a, lang, `faq-${i}`)}
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </>
    );
  } catch {
    /* noop: fallback renderer failed safely */
  }
  return null;
}
