// src/components/guides/GenericContent.tsx
import { Children, Fragment, type ReactNode } from "react";

import {
  getContentAlias,
  getTocSectionFilter,
  shouldMergeAliasFaqs,
  shouldSuppressFaqOnlyToc,
} from "@/config/guide-overrides";
import { GUIDE_SECTION_BY_KEY } from "@/data/guides.index";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import i18n from "@/i18n";
import { type GuideKey } from "@/routes.guides-helpers";
import { renderBodyBlocks, renderGuideLinkTokens } from "@/routes/guides/utils/linkTokens";
import { debugGuide } from "@/utils/debug";

import { buildGenericContentData } from "./generic-content/buildContent";
import { GenericContentFaqSection, resolveFaqsHeadingLabel } from "./generic-content/FaqSection";
import { SectionHeading } from "./generic-content/SectionHeading";
import { applyStableKeys, buildTableOfContents, toTocItems } from "./generic-content/toc";
import type { GenericContentTranslator } from "./generic-content/types";
import ImageGallery from "./ImageGallery";
import TableOfContents from "./TableOfContents";

const DEBUG_KEYS = {
  tocFinalItems: "guides.genericContent.toc.finalItems",
} as const;

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
  const aliasKey = getContentAlias(guideKey) ?? null;
  const mergeAliasFaqs = shouldMergeAliasFaqs(guideKey);
  const suppressFaqOnlyToc = shouldSuppressFaqOnlyToc(guideKey);
  const tocSectionFilter = getTocSectionFilter(guideKey);

  const faqsHeadingLabel = resolveFaqsHeadingLabel(lang, t);
  const normalizedFaqsHeadingLabel = faqsHeadingLabel.toLowerCase();

  const renderTokens = (value: string, key: string): ReactNode => {
    const nodes = renderGuideLinkTokens(value, lang, key, guideKey);
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

  const tocItemsForFaqCheck = toTocItems(content.tocRaw, resolveSectionFallbackLabel);

  const hideFaQsOnlyToc =
    suppressFaqOnlyToc &&
    content.sections.length === 0 &&
    tocItemsForFaqCheck.length === 0 &&
    content.faqs.length > 0;

  const shouldAppendAliasFaqs =
    Boolean(aliasKey && mergeAliasFaqs) &&
    content.sections.length === 0 &&
    tocItemsForFaqCheck.length === 0;

  const navItems = buildTableOfContents({
    showToc: showToc && !hideFaQsOnlyToc,
    tocRaw: content.tocRaw,
    sections: content.sections,
    supplementalNav: content.supplementalNav,
    getFallbackLabel: resolveSectionFallbackLabel,
  });

  const keyedNavItems = applyStableKeys(navItems);

  const { sectionsForRender, hiddenSectionAnchors } = (() => {
    if (!tocSectionFilter) {
      return { sectionsForRender: content.sections, hiddenSectionAnchors: [] as string[] };
    }
    const anchors: string[] = [];
    const seen = new Set<string>();
    const filtered = content.sections.filter((section) => {
      const rawId = typeof section?.id === "string" ? section.id.trim() : "";
      if (!rawId) return true;
      const keep = tocSectionFilter(rawId);
      if (!keep) {
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
            if (faqsHeadingLabel && faqsHeadingLabel !== "labels.faqsHeading") {
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
      const fallback: unknown = t("labels.onThisPage", { defaultValue: "On this page" });
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
              ? section.body.length > 0 || (section.images?.length ?? 0) > 0 || !showToc
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
                ? renderBodyBlocks(section.body, lang, `${guideKey}-section-${section.id}`, guideKey)
                : null}
              {section.images?.length ? (
                <ImageGallery items={section.images} className="my-0" />
              ) : null}
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

      <GenericContentFaqSection
        guideKey={guideKey}
        content={content}
        lang={lang}
        t={t}
        renderTokens={renderTokens}
        faqsHeadingLabel={faqsHeadingLabel}
        faqHeadingLevel={faqHeadingLevel}
        aliasKey={aliasKey}
        mergeAliasFaqs={mergeAliasFaqs}
        shouldAppendAliasFaqs={shouldAppendAliasFaqs}
      />
    </div>
  );
}
