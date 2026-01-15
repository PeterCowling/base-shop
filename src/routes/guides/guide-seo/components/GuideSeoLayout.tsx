// src/routes/guides/guide-seo/components/GuideSeoLayout.tsx
/* eslint-disable import/require-twitter-card, import/require-xdefault-canonical -- TECH-000: Non-route helper under routes; head tags come from the guide route */
/* eslint-disable @typescript-eslint/no-explicit-any -- SEO-2743 Template helper */
import { useMemo, useRef } from "react";

import { Section } from "@acme/ui/atoms/Section";

import TableOfContents from "@/components/guides/TableOfContents";
import getGuideResource from "@/routes/guides/utils/getGuideResource";

import DevStatusPill from "./DevStatusPill";
import GuideEditorialPanel from "./GuideEditorialPanel";
import ArticleHeader from "./ArticleHeader";
import StructuredTocBlock from "./StructuredTocBlock";
import GenericOrFallbackContent from "./GenericOrFallbackContent";
import FooterWidgets from "./FooterWidgets";
import type { GuideSeoLayoutState } from "../useGuideSeoConfig";

export default function GuideSeoLayout({
  lang,
  guideKey,
  manifestEntry,
  resolvedStatus,
  checklistSnapshot,
  draftUrl,
  isDraftRoute,
  shouldShowEditorialPanel,
  displayH1Title,
  effectiveTitle,
  subtitleText,
  title,
  description,
  sections,
  intro,
  faqs,
  baseToc,
  fallbackStructured,
  translations,
  t,
  hookI18n,
  context,
  structuredTocItems,
  buildTocItems,
  renderGenericContent,
  effectiveGenericOptions,
  articleDescriptionForGeneric,
  hasAnyLocalized,
  hasLocalizedContent,
  hasLocalizedForRendering,
  hasStructuredLocalInitial,
  preferManualWhenUnlocalized,
  preferGenericWhenFallback,
  renderGenericWhenEmpty,
  showTocWhenUnlocalized,
  suppressTocTitle,
  suppressUnlocalizedFallback,
  showPlanChoice,
  showTransportNotice,
  showTagChips,
  showRelatedWhenLocalized,
  relatedGuides,
  alsoHelpful,
  articleLead,
  articleExtras,
  afterArticle,
}: GuideSeoLayoutState): JSX.Element {
  const articleLeadNodeRef = useRef<React.ReactNode | null>(null);
  if (articleLeadNodeRef.current === null) {
    articleLeadNodeRef.current = articleLead ? articleLead(context) : null;
  }

  const articleExtrasNodeRef = useRef<React.ReactNode | null>(null);
  if (articleExtrasNodeRef.current === null) {
    articleExtrasNodeRef.current = articleExtras ? articleExtras(context) : null;
  }

  const afterArticleNode = useMemo(
    () => (afterArticle ? afterArticle(context) : null),
    [afterArticle, context],
  );

  return (
    <>
      <Section as="div" padding="none" className="mx-auto max-w-3xl px-4">
        <DevStatusPill guideKey={guideKey as any} />
        <article className="prose prose-slate dark:prose-invert prose-headings:font-semibold prose-headings:text-brand-heading dark:prose-headings:text-brand-surface prose-p:text-justify space-y-10">
          {shouldShowEditorialPanel && manifestEntry ? (
            <GuideEditorialPanel
              manifest={manifestEntry}
              status={resolvedStatus}
              checklist={checklistSnapshot}
              draftUrl={draftUrl}
              isDraftRoute={isDraftRoute}
              dashboardUrl={`/${lang}/draft`}
            />
          ) : null}
          <ArticleHeader
            displayTitle={displayH1Title as string}
            subtitle={subtitleText}
            debug={{
              lang: lang as any,
              guideKey: guideKey as any,
              effectiveTitle: (effectiveTitle as string) ?? "",
              hasLocalizedContent,
              article: { title: title as any, description: description as any },
              counts: {
                sections: sections.length,
                intro: intro.length,
                faqs: faqs.length,
                baseToc: baseToc.length,
              },
            }}
          />
          {(() => {
            try {
              if (hasLocalizedContent) return null;
              if (!preferManualWhenUnlocalized) return null;
              if (suppressUnlocalizedFallback) return null;
              const fb = fallbackStructured as any;
              const introFallback = Array.isArray(fb?.intro)
                ? (fb.intro as unknown[])
                    .map((p) => (typeof p === "string" ? p.trim() : ""))
                    .filter((p): p is string => p.length > 0)
                : [];
              const sectionsFallback = Array.isArray(fb?.sections)
                ? (fb.sections as Array<{ id?: string; title?: string; body?: unknown[] }>)
                : [];
              const meaningful = sectionsFallback
                .map((s, idx) => ({
                  id:
                    typeof s?.id === "string" && s.id.trim().length > 0 ? s.id.trim() : `s-${idx}`,
                  title: typeof s?.title === "string" ? s.title.trim() : "",
                  body: Array.isArray(s?.body)
                    ? (s?.body as unknown[]).filter(
                        (p): p is string => typeof p === "string" && p.trim().length > 0,
                      )
                    : [],
                }))
                .filter((s) => s.body.length > 0 || s.title.length > 0);
              if (introFallback.length === 0 && meaningful.length === 0) return null;
              const tocItems = meaningful
                .map((s) => ({ href: `#${s.id}`, label: s.title || s.id }))
                .filter((it) => it.label.length > 0);
              return (
                <>
                  {introFallback.map((paragraph, idxParagraph) => (
                    <p key={`fb-intro-${idxParagraph}`}>{paragraph}</p>
                  ))}
                  {tocItems.length > 0 ? <TableOfContents items={tocItems} /> : null}
                  {meaningful.map((s, idxSection) => (
                    <section
                      key={`${s.id}-${idxSection}`}
                      id={s.id}
                      className="scroll-mt-28 space-y-4"
                    >
                      {s.title ? <h2 className="text-xl font-semibold">{s.title}</h2> : null}
                      {s.body.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </section>
                  ))}
                </>
              );
            } catch {
              return null;
            }
          })()}
          {(() => {
            const suppressStructuredTocBlock =
              guideKey === ("offSeasonLongStay" as any) ||
              (preferManualWhenUnlocalized && !hasLocalizedContent);
            if (suppressStructuredTocBlock) {
              return null;
            }
            return (
            <StructuredTocBlock
              itemsBase={structuredTocItems as any}
              context={context}
              tGuides={translations.tGuides as any}
              guideKey={guideKey as any}
              sections={sections as any}
              faqs={faqs as any}
              buildTocItems={buildTocItems}
              renderGenericContent={Boolean(renderGenericContent)}
              genericContentOptions={effectiveGenericOptions as any}
              hasLocalizedContent={
                preferManualWhenUnlocalized ? hasLocalizedContent : hasLocalizedForRendering
              }
              showTocWhenUnlocalized={showTocWhenUnlocalized}
              suppressTocTitle={suppressTocTitle}
              fallbackStructured={fallbackStructured as any}
              preferManualWhenUnlocalized={preferManualWhenUnlocalized}
              suppressUnlocalizedFallback={suppressUnlocalizedFallback}
              preferGenericWhenFallback={preferGenericWhenFallback}
              requestedLang={lang as any}
            />
            );
          })()}
          {articleLeadNodeRef.current}

          {(() => {
            const suppressGenericContentBlock =
              (guideKey === ("offSeasonLongStay" as any) && !hasAnyLocalized) ||
              (preferManualWhenUnlocalized && !hasLocalizedContent);
            if (suppressGenericContentBlock) return null;
            return (
            <GenericOrFallbackContent
              lang={lang as any}
              guideKey={guideKey as any}
              translations={translations as any}
              t={t as any}
              hookI18n={hookI18n as any}
              context={context}
              articleDescription={articleDescriptionForGeneric}
              renderGenericContent={(() => {
                if ((guideKey as any) === ("luggageStorage" as any) && hasStructuredLocalInitial) {
                  return false;
                }
                if ((guideKey as any) === ("weekend48Positano" as any) && hasStructuredLocalInitial) {
                  return false;
                }
                if ((guideKey as any) === ("whatToPack" as any)) {
                  const hasRuntime = (() => {
                    try {
                      const normalize = (v: unknown): string[] =>
                        Array.isArray(v)
                          ? (v as unknown[])
                              .map((x) =>
                                typeof x === "string" ? x.trim() : String(x ?? "").trim(),
                              )
                              .filter((s) => s.length > 0)
                          : [];
                      const introRuntime = getGuideResource<unknown>(
                        lang as any,
                        `content.${guideKey}.intro`,
                      );
                      const sectionsRuntime = getGuideResource<unknown>(
                        lang as any,
                        `content.${guideKey}.sections`,
                      );
                      const introOk = normalize(introRuntime).length > 0;
                      const sectionsOk = Array.isArray(sectionsRuntime)
                        ? (sectionsRuntime as unknown[]).some((s) => {
                            if (!s || typeof s !== "object") return false;
                            const rec = s as Record<string, unknown>;
                            const titleValue =
                              typeof rec.title === "string" ? rec.title.trim() : "";
                            const body = normalize(rec.body ?? rec.items);
                            return titleValue.length > 0 || body.length > 0;
                          })
                        : false;
                      return introOk || sectionsOk;
                    } catch {
                      return false;
                    }
                  })();
                  if (!(hasAnyLocalized || hasRuntime)) {
                    return false;
                  }
                }
                if ((guideKey as any) === ("ecoFriendlyAmalfi" as any) && !hasStructuredLocalInitial) {
                  return false;
                }
                if (
                  (guideKey as any) === ("workCafes" as any) &&
                  !(hasStructuredLocalInitial || hasLocalizedContent)
                ) {
                  return false;
                }
                return Boolean(renderGenericContent);
              })()}
              renderWhenEmpty={Boolean(renderGenericWhenEmpty)}
              suppressUnlocalizedFallback={suppressUnlocalizedFallback}
              hasLocalizedContent={
                preferManualWhenUnlocalized ? hasLocalizedContent : hasLocalizedForRendering
              }
              genericContentOptions={effectiveGenericOptions as any}
              structuredTocItems={structuredTocItems as any}
              customTocProvided={typeof buildTocItems === "function"}
              preferManualWhenUnlocalized={preferManualWhenUnlocalized}
              preferGenericWhenFallback={preferGenericWhenFallback}
              showTocWhenUnlocalized={showTocWhenUnlocalized}
              suppressTocTitle={suppressTocTitle}
              fallbackStructured={fallbackStructured as any}
            />
            );
          })()}

          {articleExtrasNodeRef.current}
        </article>
      </Section>
      <Section as="div" padding="none" className="max-w-4xl space-y-12 px-4 pb-16 sm:px-6 lg:px-8">
        {afterArticleNode}
        <FooterWidgets
          lang={lang as any}
          guideKey={guideKey as any}
          hasLocalizedContent={hasLocalizedContent}
          showTagChips={showTagChips}
          showPlanChoice={showPlanChoice}
          showTransportNotice={showTransportNotice}
          relatedGuides={relatedGuides as any}
          showRelatedWhenLocalized={showRelatedWhenLocalized}
          alsoHelpful={alsoHelpful as any}
          tGuides={translations.tGuides as any}
        />
      </Section>
    </>
  );
}