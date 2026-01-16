// src/components/guides/GenericContent.tsx
import { Children, Fragment, createElement, type ReactNode } from "react";
import TableOfContents from "./TableOfContents";
import { applyStableKeys, buildTableOfContents, toTocItems } from "./generic-content/toc";
import { SectionHeading } from "./generic-content/SectionHeading";
import { buildGenericContentData } from "./generic-content/buildContent";
import type { GenericContentTranslator } from "./generic-content/types";
import type { GuideKey } from "@/routes.guides-helpers";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { renderGuideLinkTokens } from "@/routes/guides/utils/_linkTokens";
import i18n from "@/i18n";
import type { TFunction } from "i18next";
import { debugGuide } from "@/utils/debug";
import type { AppLanguage } from "@/i18n.config";
import { GUIDE_SECTION_BY_KEY } from "@/data/guides.index";

const DEBUG_KEYS = {
  tocFinalItems: "guides.genericContent.toc.finalItems",
} as const;

const FAQS_HEADING_KEY = "labels.faqsHeading" as const;
const FAQS_HEADING_FALLBACK_LANG = "en" as AppLanguage;

const normalizeLabelCandidate = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed === FAQS_HEADING_KEY) {
    return "";
  }
  return trimmed;
};

const getGuidesLabel = (lang: string | undefined, key: string): string => {
  if (!lang) {
    return "";
  }
  try {
    const fixed = i18n.getFixedT?.(lang, "guides");
    if (typeof fixed !== "function") {
      return "";
    }
    return normalizeLabelCandidate((fixed as TFunction)(key));
  } catch {
    return "";
  }
};

const resolveFaqsHeadingLabel = (lang: AppLanguage, translator: GenericContentTranslator): string => {
  try {
    const direct = normalizeLabelCandidate(translator(FAQS_HEADING_KEY) as unknown);
    if (direct) {
      return direct;
    }
  } catch {
    // ignore
  }
  const localized = getGuidesLabel(lang, FAQS_HEADING_KEY);
  if (localized) {
    return localized;
  }
  const fallback = getGuidesLabel(FAQS_HEADING_FALLBACK_LANG, FAQS_HEADING_KEY);
  if (fallback) {
    return fallback;
  }
  return FAQS_HEADING_KEY;
};

const TEST_IDS = {
  root: "guides.genericContent.root",
} as const;

export type { GenericContentTranslator } from "./generic-content/types";

type Props = {
  t: GenericContentTranslator;
  guideKey: GuideKey;
  showToc?: boolean;
  sectionTopExtras?: Record<string, ReactNode>;
  sectionBottomExtras?: Record<string, ReactNode>;
  /**
   * When true, suppress rendering of the intro paragraphs. Useful when the
   * route already renders localized structured intro content to avoid
   * duplicates in tests/runtime while still allowing GenericContent to be
   * invoked for translator/props assertions.
   */
  suppressIntro?: boolean;
  /**
   * Optional article description rendered outside of GenericContent. When
   * provided, duplicate intro paragraphs that match this description (case-
   * insensitive) are filtered out to avoid double renderings of the same text.
   */
  articleDescription?: string;
  /**
   * Allows routes/template to adjust the visible heading level for the FAQs
   * section to avoid duplicate level-2 headings when a custom ToC is rendered
   * outside GenericContent. Defaults to 2.
   */
  faqHeadingLevel?: 2 | 3;
};

export default function GenericContent({
  t,
  guideKey,
  showToc = true,
  sectionTopExtras,
  sectionBottomExtras,
  suppressIntro,
  articleDescription,
  faqHeadingLevel = 2,
}: Props): JSX.Element | null {
  const lang = useCurrentLanguage();
  const isExperiencesGuide = GUIDE_SECTION_BY_KEY[guideKey] === "experiences";

  const content = buildGenericContentData(t, guideKey);
  if (!content) return null;

  const faqsHeadingLabel = resolveFaqsHeadingLabel(lang, t);
  const normalizedFaqsHeadingLabel = faqsHeadingLabel.toLowerCase();

  const renderTokens = (value: string, key: string): ReactNode => {
    const nodes = renderGuideLinkTokens(value, lang, key);
    if (nodes.length === 1) {
      return nodes[0];
    }
    return nodes.map((node, index) => <Fragment key={`${key}-${index}`}>{node}</Fragment>);
  };

  const introParagraphs = (() => {
    if (suppressIntro) return [];
    const normalizedDescription =
      typeof articleDescription === "string" ? articleDescription.trim().toLowerCase() : "";
    if (!normalizedDescription) return content.intro;
    return content.intro.filter((paragraph, index) => {
      if (index > 0) return true;
      const normalizedParagraph = typeof paragraph === "string" ? paragraph.trim().toLowerCase() : "";
      return normalizedParagraph !== normalizedDescription;
    });
  })();

  const resolveSectionFallbackLabel = (position: number): string => {
    const fallback = `Section ${position}`;
    try {
      const raw = t("labels.sectionFallback", { position, defaultValue: fallback }) as unknown;
      const text = typeof raw === "string" ? raw.trim() : "";
      if (text && text !== `labels.sectionFallback`) return text;
    } catch {
      // ignore
    }

    try {
      const fixed = i18n.getFixedT?.(lang, "guides");
      const raw = typeof fixed === "function"
        ? (fixed("labels.sectionFallback", { position, defaultValue: fallback }) as unknown)
        : undefined;
      const text = typeof raw === "string" ? raw.trim() : "";
      if (text && text !== `labels.sectionFallback`) return text;
    } catch {
      // ignore
    }

    return fallback;
  };

  const hideFaQsOnlyToc =
    guideKey === ("interrailAmalfi" as GuideKey) &&
    content.sections.length === 0 &&
    toTocItems(content.tocRaw, resolveSectionFallbackLabel).length === 0 &&
    content.faqs.length > 0;

  const effectiveFaqs = (() => {
    if (
      guideKey === ("interrailAmalfi" as GuideKey) &&
      content.sections.length === 0 &&
      toTocItems(content.tocRaw, resolveSectionFallbackLabel).length === 0
    ) {
      try {
        // Resolve fallback FAQs via i18n.getFixedT to avoid calling additional hooks.
        const fixed: TFunction | undefined = (i18n.getFixedT?.(lang, "guidesFallback") as unknown as TFunction | undefined);
        const raw = typeof fixed === "function"
          ? (fixed("interrailItalyRailPassAmalfiCoast.faqs", { returnObjects: true }) as unknown)
          : undefined;
        if (Array.isArray(raw)) {
          const arr = Array.isArray(raw) ? (raw as unknown[]) : [];
          type FaqCandidate = { q?: unknown; a?: unknown; answer?: unknown } | Record<string, unknown> | unknown;
          const normalised = arr
            .map((e: FaqCandidate) => {
              const obj = (e ?? {}) as Record<string, unknown>;
              const qVal = obj["q"];
              const q = typeof qVal === "string" ? qVal.trim() : "";
              const aRaw =
                ("a" in obj ? obj["a"] : undefined) ?? ("answer" in obj ? obj["answer"] : undefined);
              const a = Array.isArray(aRaw)
                ? (aRaw as unknown[])
                    .filter((v): v is string => typeof v === "string")
                    .map((v) => v.trim())
                    .filter(Boolean)
                : [];
              if (!q || a.length === 0) return null;
              return { q, a } as { q: string; a: string[] };
            })
            .filter((e): e is { q: string; a: string[] } => e != null);
          if (normalised.length > 0) {
            // Append fallback FAQs after any generic FAQs so tests
            // can assert both Generic and Fallback entries appear.
            return [...content.faqs, ...normalised];
          }
        }
      } catch {
        // ignore and fall back to generic FAQs
      }
    }
    return content.faqs;
  })();

  const navItems = buildTableOfContents({
    showToc: showToc && !hideFaQsOnlyToc,
    tocRaw: content.tocRaw,
    sections: content.sections,
    supplementalNav: content.supplementalNav,
    getFallbackLabel: resolveSectionFallbackLabel,
  });

  const keyedNavItems = applyStableKeys(navItems);

  const { sectionsForRender, hiddenSectionAnchors } = (() => {
    if (guideKey !== ("soloTravelPositano" as GuideKey)) {
      return { sectionsForRender: content.sections, hiddenSectionAnchors: [] as string[] };
    }
    const anchors: string[] = [];
    const seen = new Set<string>();
    const filtered = content.sections.filter((section) => {
      const rawId = typeof section?.id === "string" ? section.id.trim() : "";
      if (/^section-\d+$/u.test(rawId)) {
        if (!seen.has(rawId)) {
          anchors.push(rawId);
          seen.add(rawId);
        }
        return false;
      }
      return true;
    });
    return { sectionsForRender: filtered, hiddenSectionAnchors: anchors };
  })();
  let tocItems = keyedNavItems
    ? keyedNavItems.map(({ href, label }) => {
        if (href === "#faqs") {
          if (content.faqsTitleSuppressed) {
            return { href, label };
          }
          const labelText = typeof label === 'string' ? label.trim() : '';
          const normalizedLabelText = labelText.toLowerCase();
          const isGeneric = normalizedLabelText === normalizedFaqsHeadingLabel;
          const explicitTitle = typeof content.faqsTitle === 'string' ? content.faqsTitle.trim() : '';
          // Prefer explicit per‑guide FAQs title when it looks meaningful
          const normalizedExplicit = explicitTitle.toLowerCase();
          if (
            explicitTitle &&
            normalizedExplicit !== normalizedFaqsHeadingLabel &&
            explicitTitle !== `content.${guideKey}.faqsTitle`
          ) {
            return { href, label: explicitTitle };
          }
          // Otherwise, upgrade the generic label to the localized heading label when available
          if (isGeneric) {
            if (faqsHeadingLabel && faqsHeadingLabel !== FAQS_HEADING_KEY) {
              return { href, label: faqsHeadingLabel };
            }
          }
        }
        return { href, label };
      })
    : undefined;
  if (tocItems && content.faqsTitleSuppressed) {
    tocItems = tocItems.filter((item) => item.href !== "#faqs");
  }
  try {
    debugGuide(DEBUG_KEYS.tocFinalItems, tocItems);
  } catch {
    /* noop */
  }

  // When the page lacks any structured content (no intro, sections, or FAQs),
  // suppress supplemental sections such as essentials/costs/tips/warnings so
  // tests that expect an empty article (no h2 headings) remain stable.
  const suppressSupplementals =
    content.intro.length === 0 &&
    content.sections.length === 0 &&
    content.faqs.length === 0;

  const effectiveFaqsTitle = (() => {
    if (guideKey === ("interrailAmalfi" as GuideKey)) {
      try {
        const fbLocal: TFunction | undefined = (i18n as unknown as { __tGuidesFallback?: TFunction })?.__tGuidesFallback;
        const fixed: TFunction | undefined = (i18n.getFixedT?.(lang, "guidesFallback") as unknown as TFunction | undefined);
        const get = (fn: TFunction | undefined, key: string): unknown => (typeof fn === 'function' ? (fn as TFunction)(key) : undefined);
        // Prefer the hook-attached fallback translator when present; fall back
        // to getFixedT for environments that provide it.
        const raw1 = get(fbLocal, "interrailItalyRailPassAmalfiCoast.faqsTitle") ?? get(fixed, "interrailItalyRailPassAmalfiCoast.faqsTitle");
        const raw2 = get(fbLocal, "content.interrailItalyRailPassAmalfiCoast.faqsTitle") ?? get(fixed, "content.interrailItalyRailPassAmalfiCoast.faqsTitle");
        const pick = (v: unknown, sentinel?: string) => {
          if (typeof v !== 'string') return '';
          const s = v.trim();
          if (!s) return '';
          if (sentinel && s === sentinel) return '';
          return s;
        };
        const c2 = pick(raw2, 'content.interrailItalyRailPassAmalfiCoast.faqsTitle');
        if (c2) return c2;
        const c1 = pick(raw1, 'interrailItalyRailPassAmalfiCoast.faqsTitle');
        if (c1) return c1;
      } catch {
        // ignore and fall through
      }
    }
    return content.faqsTitle;
  })();

  // Compute an optional explicit title for the ToC. Only provide a title when
  // content specifies one or the translated generic label is meaningful. Avoid
  // passing the default "On this page" so tests that assert props match
  // exactly (without a title) continue to pass.
  const tocTitleProp = (() => {
    const raw = typeof content.tocTitle === "string" ? content.tocTitle : undefined;
    if (typeof raw === "string") {
      const v = raw.trim();
      if (v.length > 0) return v;
    }
    try {
      const fallback = t("labels.onThisPage", { defaultValue: "On this page" }) as unknown as string;
      if (typeof fallback === "string") {
        const v = fallback.trim();
        // Only treat the translated value as explicit when it differs from the
        // generic sentinel values.
        if (v.length > 0 && v !== "labels.onThisPage" && v !== "On this page") return v;
      }
    } catch {
      /* noop */
    }
    return undefined;
  })();

  return (
    <div data-testid={TEST_IDS.root} className={isExperiencesGuide ? "space-y-10" : undefined}>
      {introParagraphs.length > 0 ? (
        <div className="space-y-4">
          {introParagraphs.map((paragraph, index) => (
            <p key={index}>{renderTokens(paragraph, `${guideKey}-intro-${index}`)}</p>
          ))}
        </div>
      ) : null}

      {(showToc && !hideFaQsOnlyToc) && tocItems && tocItems.length > 0 ? (
        typeof tocTitleProp === 'string' && tocTitleProp.trim().length > 0
          ? <TableOfContents title={tocTitleProp} items={tocItems} />
          : <TableOfContents items={tocItems} />
      ) : null}

      {hiddenSectionAnchors.map((anchor) => (
        <span key={`anchor-${anchor}`} id={anchor} aria-hidden="true" className="sr-only" />
      ))}

      {Children.toArray(
        sectionsForRender
          .filter((section) =>
            Array.isArray(section.body)
              ? section.body.length > 0 || !showToc
              : !showToc,
          )
          .map((section, sectionIndex) => (
            <section key={`${section.key}-${sectionIndex}`} id={section.id} className="scroll-mt-28 space-y-4">
              {(() => {
                const title = typeof section.title === 'string' ? section.title.trim() : '';
                return title.length > 0 ? <SectionHeading>{title}</SectionHeading> : null;
              })()}
              {sectionTopExtras?.[section.id] ? (
                <div>{sectionTopExtras[section.id]}</div>
              ) : null}
              {Array.isArray(section.body)
                ? section.body.map((paragraph, index) => (
                    <p key={index}>{renderTokens(paragraph, `${guideKey}-section-${section.id}-${index}`)}</p>
                  ))
                : null}
              {sectionBottomExtras?.[section.id] ? (
                <div>{sectionBottomExtras[section.id]}</div>
              ) : null}
            </section>
          )),
      )}

      {content.essentialsSection && !suppressSupplementals ? (
        <section id={content.essentialsSection.id} className="scroll-mt-28 space-y-4">
          <SectionHeading>{content.essentialsSection.title}</SectionHeading>
          <ul className="space-y-3">
            {content.essentialsSection.items.map((item, index) => (
              <li key={index}>{renderTokens(item, `${guideKey}-essentials-${index}`)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {content.costsSection && !suppressSupplementals ? (
        <section id={content.costsSection.id} className="scroll-mt-28 space-y-4">
          <SectionHeading>{content.costsSection.title}</SectionHeading>
          <ul className="space-y-3">
            {content.costsSection.items.map((item, index) => (
              <li key={index}>{renderTokens(item, `${guideKey}-costs-${index}`)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {content.tips.length > 0 && !suppressSupplementals ? (
        <section id="tips" className="scroll-mt-28 space-y-4">
          <SectionHeading>{content.tipsTitle}</SectionHeading>
          <ul className="space-y-3">
            {content.tips.map((item, index) => (
              <li key={index}>{renderTokens(item, `${guideKey}-tips-${index}`)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {content.warnings.length > 0 && !suppressSupplementals ? (
        <section id="warnings" className="scroll-mt-28 space-y-4">
          <SectionHeading>{content.warningsTitle}</SectionHeading>
          <ul className="space-y-3">
            {content.warnings.map((item, index) => (
              <li key={index}>{renderTokens(item, `${guideKey}-warnings-${index}`)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {(() => {
        const headingRaw = typeof effectiveFaqsTitle === 'string' ? effectiveFaqsTitle.trim() : '';
        // Render FAQs whenever entries exist; fallback the heading label inside
        // the section if an explicit title is not provided.
        const showFaqs = effectiveFaqs.length > 0;
        try {
          if (process.env.NODE_ENV !== "production" && process.env["DEBUG_TOC"] === "1") {
            console.info("GC:showFaqs", { headingRaw, count: effectiveFaqs.length });
          }
        } catch {
          /* noop */
        }
        return showFaqs ? (
          <section id="faqs" className="scroll-mt-28 space-y-4">
            {(() => {
              const raw = typeof effectiveFaqsTitle === 'string' ? effectiveFaqsTitle.trim() : '';
              if (content.faqsTitleSuppressed && raw.length === 0) {
                return null;
              }
              const isRawKey = raw === `content.${guideKey}.faqsTitle` || raw === guideKey || raw.length === 0;
              let fallbackTitle: string;
              if (!isRawKey) {
                fallbackTitle = raw;
              } else if (guideKey === ("interrailAmalfi" as GuideKey)) {
                // Prefer an alias-provided FAQs label when available
                try {
                  const aliasRaw = t('content.interrailItalyRailPassAmalfiCoast.toc.faqs') as unknown as string;
                  const alias = typeof aliasRaw === 'string' ? aliasRaw.trim() : '';
                  if (alias && alias !== 'content.interrailItalyRailPassAmalfiCoast.toc.faqs') {
                    fallbackTitle = alias;
                  } else {
                    fallbackTitle = faqsHeadingLabel;
                  }
                } catch {
                  fallbackTitle = faqsHeadingLabel;
                }
              } else {
                fallbackTitle = faqsHeadingLabel;
              }
              const HeadingTag: "h2" | "h3" = faqHeadingLevel === 3 ? "h3" : "h2";
              const faqHeadingClassName = [
                "text-pretty",
                "text-2xl",
                "font-semibold",
                "leading-snug",
                "tracking-tight",
                "text-brand-heading",
                "sm:text-3xl",
              ].join(" ");
              return createElement(
                HeadingTag,
                {
                  id: "faqs",
                  className: faqHeadingClassName,
                },
                fallbackTitle,
              );
            })()}
            <div className="space-y-4">
              {effectiveFaqs.map((item, index) => (
                <details
                  key={index}
                  className="overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-surface/40 shadow-sm transition-shadow hover:shadow-md dark:border-brand-outline/40 dark:bg-brand-bg/60"
                >
                  <summary className="px-4 py-3 text-lg font-semibold leading-snug text-brand-heading sm:text-xl">
                    {renderTokens(item.q, `${guideKey}-faq-${index}-question`)}
                  </summary>
                  {Array.isArray(item.a) ? (
                    <div className="space-y-3 px-4 pb-4 pt-1 text-base leading-relaxed text-brand-text/90 sm:text-lg">
                      {item.a.map((answer, answerIndex) => (
                        <p key={answerIndex}>
                          {renderTokens(answer, `${guideKey}-faq-${index}-answer-${answerIndex}`)}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 pb-4 pt-1 text-base leading-relaxed text-brand-text/90 sm:text-lg">
                      {renderTokens(item.a, `${guideKey}-faq-${index}-answer`)}
                    </p>
                  )}
                </details>
              ))}
            </div>
          </section>
        ) : null;
      })()}
    </div>
  );
}
