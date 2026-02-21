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

type GenericContentData = NonNullable<ReturnType<typeof buildGenericContentData>>;
type StableNavItems = ReturnType<typeof applyStableKeys>;
type StableNavItem = NonNullable<StableNavItems>[number];
type TocItem = Pick<StableNavItem, "href" | "label">;
type AppLanguage = ReturnType<typeof useCurrentLanguage>;

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

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function createRenderTokens({
  lang,
  guideKey,
}: {
  lang: AppLanguage;
  guideKey: GuideKey;
}): (value: string, key: string) => ReactNode {
  return (value: string, key: string): ReactNode => {
    const nodes = renderGuideLinkTokens(value, lang, key, guideKey);
    if (nodes.length === 1) {
      return nodes[0];
    }
    return nodes.map((node, index) => <Fragment key={`${key}-${index}`}>{node}</Fragment>);
  };
}

function buildIntroParagraphs({
  intro,
  suppressIntro,
  articleDescription,
}: {
  intro: GenericContentData["intro"];
  suppressIntro?: boolean;
  articleDescription?: string;
}): GenericContentData["intro"] {
  if (suppressIntro) return [];
  const normalizedDescription =
    typeof articleDescription === "string" ? articleDescription.trim().toLowerCase() : "";
  if (!normalizedDescription) return intro;
  return intro.filter((paragraph, index) => {
    if (index > 0) return true;
    const normalizedParagraph = typeof paragraph === "string" ? paragraph.trim().toLowerCase() : "";
    return normalizedParagraph !== normalizedDescription;
  });
}

function resolveSectionFallbackLabel({
  lang,
  position,
  t,
}: {
  lang: AppLanguage;
  position: number;
  t: GenericContentTranslator;
}): string {
  const fallback = `Section ${position}`;
  try {
    const raw = t("labels.sectionFallback", { position, defaultValue: fallback }) as unknown;
    const text = normalizeText(raw);
    if (text && text !== "labels.sectionFallback") return text;
  } catch {
    // ignore
  }

  try {
    const fixed = i18n.getFixedT?.(lang, "guides");
    const raw =
      typeof fixed === "function"
        ? (fixed("labels.sectionFallback", { position, defaultValue: fallback }) as unknown)
        : undefined;
    const text = normalizeText(raw);
    if (text && text !== "labels.sectionFallback") return text;
  } catch {
    // ignore
  }

  return fallback;
}

function filterSectionsForToc({
  sections,
  tocSectionFilter,
}: {
  sections: GenericContentData["sections"];
  tocSectionFilter: ((sectionId: string) => boolean) | null | undefined;
}): { sectionsForRender: GenericContentData["sections"]; hiddenSectionAnchors: string[] } {
  if (!tocSectionFilter) {
    return { sectionsForRender: sections, hiddenSectionAnchors: [] };
  }

  const anchors: string[] = [];
  const seen = new Set<string>();
  const filtered = sections.filter((section) => {
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
}

function buildFaqAwareTocItems({
  guideKey,
  keyedNavItems,
  content,
  faqsHeadingLabel,
  normalizedFaqsHeadingLabel,
}: {
  guideKey: GuideKey;
  keyedNavItems: StableNavItems;
  content: GenericContentData;
  faqsHeadingLabel: string;
  normalizedFaqsHeadingLabel: string;
}): TocItem[] | undefined {
  if (!keyedNavItems) return undefined;

  let tocItems: TocItem[] = keyedNavItems.map(({ href, label }) => {
    if (href !== "#faqs") return { href, label };
    if (content.faqsTitleSuppressed) return { href, label };

    const labelText = normalizeText(label).toLowerCase();
    const isGeneric = labelText === normalizedFaqsHeadingLabel;

    const explicitTitle = normalizeText(content.faqsTitle);
    const normalizedExplicit = explicitTitle.toLowerCase();
    if (
      explicitTitle &&
      normalizedExplicit !== normalizedFaqsHeadingLabel &&
      explicitTitle !== `content.${guideKey}.faqsTitle`
    ) {
      return { href, label: explicitTitle };
    }

    if (isGeneric && faqsHeadingLabel && faqsHeadingLabel !== "labels.faqsHeading") {
      return { href, label: faqsHeadingLabel };
    }

    return { href, label };
  });

  if (content.faqsTitleSuppressed) {
    tocItems = tocItems.filter((item) => item.href !== "#faqs");
  }

  return tocItems;
}

function resolveTocTitleProp({
  contentTocTitle,
  t,
}: {
  contentTocTitle: GenericContentData["tocTitle"];
  t: GenericContentTranslator;
}): string | undefined {
  const raw = typeof contentTocTitle === "string" ? contentTocTitle : undefined;
  if (typeof raw === "string") {
    const v = raw.trim();
    if (v.length > 0) return v;
  }

  try {
    const fallback: unknown = t("labels.onThisPage", { defaultValue: "On this page" });
    if (typeof fallback === "string") {
      const v = fallback.trim();
      if (v.length > 0 && v !== "labels.onThisPage" && v !== "On this page") return v;
    }
  } catch {
    /* noop */
  }

  return undefined;
}

function shouldRenderStructuredSection({
  section,
  showToc,
}: {
  section: GenericContentData["sections"][number];
  showToc: boolean;
}): boolean {
  if (!Array.isArray(section.body)) return !showToc;
  return section.body.length > 0 || (section.images?.length ?? 0) > 0 || !showToc;
}

function renderStructuredSections({
  sectionsForRender,
  lang,
  guideKey,
  showToc,
  sectionTopExtras,
  sectionBottomExtras,
}: {
  sectionsForRender: GenericContentData["sections"];
  lang: AppLanguage;
  guideKey: GuideKey;
  showToc: boolean;
  sectionTopExtras?: Record<string, ReactNode>;
  sectionBottomExtras?: Record<string, ReactNode>;
}): ReactNode {
  return Children.toArray(
    sectionsForRender
      .filter((section) => shouldRenderStructuredSection({ section, showToc }))
      .map((section, sectionIndex) => {
        const title = normalizeText(section.title);
        return (
          <section
            key={`${section.key}-${sectionIndex}`}
            id={section.id}
            className="scroll-mt-28 space-y-4"
          >
            {title.length > 0 ? <SectionHeading>{title}</SectionHeading> : null}
            {sectionTopExtras?.[section.id] ? <div>{sectionTopExtras[section.id]}</div> : null}
            {Array.isArray(section.body)
              ? renderBodyBlocks(section.body, lang, `${guideKey}-section-${section.id}`, guideKey)
              : null}
            {section.images?.length ? <ImageGallery items={section.images} className="my-0" /> : null}
            {sectionBottomExtras?.[section.id] ? <div>{sectionBottomExtras[section.id]}</div> : null}
          </section>
        );
      }),
  );
}

function renderSimpleListSection({
  id,
  title,
  items,
  tokenKeyPrefix,
  guideKey,
  renderTokens,
}: {
  id: string;
  title: string;
  items: string[];
  tokenKeyPrefix: string;
  guideKey: GuideKey;
  renderTokens: (value: string, key: string) => ReactNode;
}): ReactNode {
  if (items.length === 0) return null;
  return (
    <section id={id} className="scroll-mt-28 space-y-4">
      <SectionHeading>{title}</SectionHeading>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={`${guideKey}-${tokenKeyPrefix}-${index}`}>{renderTokens(item, `${guideKey}-${tokenKeyPrefix}-${index}`)}</li>
        ))}
      </ul>
    </section>
  );
}

function safeDebugGuide(key: string, value: unknown) {
  try {
    debugGuide(key, value);
  } catch {
    /* noop */
  }
}

function shouldSuppressSupplementals(content: GenericContentData): boolean {
  return content.intro.length === 0 && content.sections.length === 0 && content.faqs.length === 0;
}

function computeTocFlags({
  aliasKey,
  mergeAliasFaqs,
  suppressFaqOnlyToc,
  tocItemsForFaqCheck,
  content,
}: {
  aliasKey: string | null;
  mergeAliasFaqs: boolean;
  suppressFaqOnlyToc: boolean;
  tocItemsForFaqCheck: ReturnType<typeof toTocItems>;
  content: GenericContentData;
}): { hideFaQsOnlyToc: boolean; shouldAppendAliasFaqs: boolean } {
  const hideFaQsOnlyToc =
    suppressFaqOnlyToc &&
    content.sections.length === 0 &&
    tocItemsForFaqCheck.length === 0 &&
    content.faqs.length > 0;

  const shouldAppendAliasFaqs =
    Boolean(aliasKey && mergeAliasFaqs) &&
    content.sections.length === 0 &&
    tocItemsForFaqCheck.length === 0;

  return { hideFaQsOnlyToc, shouldAppendAliasFaqs };
}

function renderIntroParagraphs({
  introParagraphs,
  guideKey,
  renderTokens,
}: {
  introParagraphs: string[];
  guideKey: GuideKey;
  renderTokens: (value: string, key: string) => ReactNode;
}): ReactNode {
  if (introParagraphs.length === 0) return null;
  return (
    <div className="space-y-4">
      {introParagraphs.map((paragraph, index) => (
        <p key={`${guideKey}-intro-${index}`}>{renderTokens(paragraph, `${guideKey}-intro-${index}`)}</p>
      ))}
    </div>
  );
}

function renderToc({
  showToc,
  hideFaQsOnlyToc,
  tocItems,
  tocTitleProp,
}: {
  showToc: boolean;
  hideFaQsOnlyToc: boolean;
  tocItems: TocItem[] | undefined;
  tocTitleProp: string | undefined;
}): ReactNode {
  if (!showToc) return null;
  if (hideFaQsOnlyToc) return null;
  if (!tocItems || tocItems.length === 0) return null;

  if (typeof tocTitleProp === "string" && tocTitleProp.trim().length > 0) {
    return <TableOfContents title={tocTitleProp} items={tocItems} />;
  }
  return <TableOfContents items={tocItems} />;
}

function renderHiddenAnchors(hiddenSectionAnchors: string[]): ReactNode {
  if (hiddenSectionAnchors.length === 0) return null;
  return hiddenSectionAnchors.map((anchor) => (
    <span key={`anchor-${anchor}`} id={anchor} aria-hidden="true" className="sr-only" />
  ));
}

function renderEssentialsSection({
  content,
  suppressSupplementals,
  guideKey,
  renderTokens,
}: {
  content: GenericContentData;
  suppressSupplementals: boolean;
  guideKey: GuideKey;
  renderTokens: (value: string, key: string) => ReactNode;
}): ReactNode {
  if (!content.essentialsSection || suppressSupplementals) return null;
  return renderSimpleListSection({
    id: content.essentialsSection.id,
    title: content.essentialsSection.title,
    items: content.essentialsSection.items,
    tokenKeyPrefix: "essentials",
    guideKey,
    renderTokens,
  });
}

function renderCostsSection({
  content,
  suppressSupplementals,
  guideKey,
  renderTokens,
}: {
  content: GenericContentData;
  suppressSupplementals: boolean;
  guideKey: GuideKey;
  renderTokens: (value: string, key: string) => ReactNode;
}): ReactNode {
  if (!content.costsSection || suppressSupplementals) return null;
  return renderSimpleListSection({
    id: content.costsSection.id,
    title: content.costsSection.title,
    items: content.costsSection.items,
    tokenKeyPrefix: "costs",
    guideKey,
    renderTokens,
  });
}

function renderTipsSection({
  content,
  suppressSupplementals,
  guideKey,
  renderTokens,
}: {
  content: GenericContentData;
  suppressSupplementals: boolean;
  guideKey: GuideKey;
  renderTokens: (value: string, key: string) => ReactNode;
}): ReactNode {
  if (suppressSupplementals) return null;
  return renderSimpleListSection({
    id: "tips",
    title: content.tipsTitle,
    items: content.tips,
    tokenKeyPrefix: "tips",
    guideKey,
    renderTokens,
  });
}

function renderWarningsSection({
  content,
  suppressSupplementals,
  guideKey,
  renderTokens,
}: {
  content: GenericContentData;
  suppressSupplementals: boolean;
  guideKey: GuideKey;
  renderTokens: (value: string, key: string) => ReactNode;
}): ReactNode {
  if (suppressSupplementals) return null;
  return renderSimpleListSection({
    id: "warnings",
    title: content.warningsTitle,
    items: content.warnings,
    tokenKeyPrefix: "warnings",
    guideKey,
    renderTokens,
  });
}

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

  const renderTokens = createRenderTokens({ lang, guideKey });
  const introParagraphs = buildIntroParagraphs({
    intro: content.intro,
    suppressIntro,
    articleDescription,
  });
  const getFallbackLabel = (position: number) => resolveSectionFallbackLabel({ lang, position, t });

  const tocItemsForFaqCheck = toTocItems(content.tocRaw, getFallbackLabel);

  const { hideFaQsOnlyToc, shouldAppendAliasFaqs } = computeTocFlags({
    aliasKey,
    mergeAliasFaqs,
    suppressFaqOnlyToc,
    tocItemsForFaqCheck,
    content,
  });

  const navItems = buildTableOfContents({
    showToc: showToc && !hideFaQsOnlyToc,
    tocRaw: content.tocRaw,
    sections: content.sections,
    supplementalNav: content.supplementalNav,
    getFallbackLabel,
  });

  const keyedNavItems = applyStableKeys(navItems);

  const { sectionsForRender, hiddenSectionAnchors } = filterSectionsForToc({
    sections: content.sections,
    tocSectionFilter,
  });
  const tocItems = buildFaqAwareTocItems({
    guideKey,
    keyedNavItems,
    content,
    faqsHeadingLabel,
    normalizedFaqsHeadingLabel,
  });
  safeDebugGuide(DEBUG_KEYS.tocFinalItems, tocItems);

  const suppressSupplementals = shouldSuppressSupplementals(content);
  const tocTitleProp = resolveTocTitleProp({ contentTocTitle: content.tocTitle, t });

  const introNode = renderIntroParagraphs({ introParagraphs, guideKey, renderTokens });
  const tocNode = renderToc({ showToc, hideFaQsOnlyToc, tocItems, tocTitleProp });
  const hiddenAnchorsNode = renderHiddenAnchors(hiddenSectionAnchors);
  const sectionsNode = renderStructuredSections({
    sectionsForRender,
    lang,
    guideKey,
    showToc,
    sectionTopExtras,
    sectionBottomExtras,
  });
  const essentialsNode = renderEssentialsSection({
    content,
    suppressSupplementals,
    guideKey,
    renderTokens,
  });
  const costsNode = renderCostsSection({ content, suppressSupplementals, guideKey, renderTokens });
  const tipsNode = renderTipsSection({ content, suppressSupplementals, guideKey, renderTokens });
  const warningsNode = renderWarningsSection({ content, suppressSupplementals, guideKey, renderTokens });

  return (
    <div data-testid={TEST_IDS.root} className={isExperiencesGuide ? "space-y-10" : undefined}>
      {introNode}
      {tocNode}
      {hiddenAnchorsNode}
      {sectionsNode}
      {essentialsNode}
      {costsNode}
      {tipsNode}
      {warningsNode}

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
