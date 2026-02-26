"use client";

/* eslint-disable ds/no-hardcoded-copy, complexity, ds/container-widths-only-at -- PUB-05 pre-existing */
// src/app/[lang]/experiences/ExperiencesPageContent.tsx
// Client component for experiences listing page
import { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

import { Section } from "@acme/design-system/atoms";

import ContentStickyCta from "@/components/cta/ContentStickyCta";
import GroupedGuideCollection from "@/components/guides/GroupedGuideCollection";
import GuideCollection from "@/components/guides/GuideCollection";
import GuideFaqSection, { type GuideFaq } from "@/components/guides/GuideFaqSection";
import { useGuideTopicOptions } from "@/components/guides/useGuideTopicOptions";
import { useOptionalModal } from "@/context/ModalContext";
import { type GuideMeta, GUIDES_INDEX } from "@/data/guides.index";
import { matchesGuideTopic, resolveGuideTopicId } from "@/data/guideTopics";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { fireCtaClick } from "@/utils/ga4-events";
import { getSlug } from "@/utils/slug";
import { getTagMeta } from "@/utils/tags";
import { resolveLabel, useEnglishFallback } from "@/utils/translation-fallback";

import ExperiencesCtaSection from "./ExperiencesCtaSection";
import ExperiencesHero from "./ExperiencesHero";
import { normalizeString, readString } from "./experiencesPageCopy";

type Props = {
  lang: AppLanguage;
  topicParam?: string;
  tagParam?: string;
  queryString?: string;
};

// Filter guides to only include published experiences.
// Draft guides are excluded so category headers won't show for empty categories.
function getExperienceGuides(): GuideMeta[] {
  return GUIDES_INDEX.filter(
    (g) => g.section === "experiences" && g.status === "live"
  );
}

function parseFaqItems(t: ReturnType<typeof useTranslation>["t"], experiencesEnT: ReturnType<typeof useEnglishFallback> | undefined): GuideFaq[] {
  type FaqItem = { question?: string; answer?: string[] };

  const parseFaqArray = (items: unknown): GuideFaq[] => {
    const candidates = Array.isArray(items) ? (items as FaqItem[]) : [];
    return candidates
      .map((item) => ({
        question: normalizeString(item?.question),
        answers: Array.isArray(item?.answer)
          ? item.answer.filter((a): a is string => typeof a === "string").map((a) => a.trim()).filter(Boolean)
          : [],
      }))
      .filter((item) => item.question && item.answers.length);
  };

  // Try primary translation first
  const raw = (() => {
    try {
      return t("faq.items", { returnObjects: true }) as unknown;
    } catch {
      return undefined;
    }
  })();

  const normalized = parseFaqArray(raw);
  if (normalized.length) return normalized;

  // Fallback to English
  if (!experiencesEnT) return [];
  try {
    const fallback = experiencesEnT("faq.items", { returnObjects: true }) as unknown;
    return parseFaqArray(fallback);
  } catch {
    return [];
  }
}

function buildGuideCopy(
  t: ReturnType<typeof useTranslation>["t"],
  experiencesEnT: ReturnType<typeof useEnglishFallback> | undefined,
  activeFilterLabel: string
) {
  const taggedHeading = activeFilterLabel
    ? readString(t, "guideCollections.taggedHeading", experiencesEnT, { tag: activeFilterLabel })
    : readString(t, "guideCollections.taggedHeading", experiencesEnT, { tag: "" });
  const taggedDescription = activeFilterLabel
    ? readString(t, "guideCollections.taggedDescription", experiencesEnT, { tag: activeFilterLabel })
    : readString(t, "guideCollections.taggedDescription", experiencesEnT, { tag: "" });
  const emptyMessage = activeFilterLabel
    ? readString(t, "guideCollections.empty", experiencesEnT, { tag: activeFilterLabel })
    : readString(t, "guideCollections.empty", experiencesEnT, { tag: "" });

  return {
    heading: readString(t, "guideCollections.heading", experiencesEnT) || "",
    description: readString(t, "guideCollections.description", experiencesEnT) || "",
    ...(taggedHeading ? { taggedHeading } : {}),
    ...(taggedDescription ? { taggedDescription } : {}),
    ...(emptyMessage ? { emptyMessage } : {}),
    clearFilterLabel: readString(t, "guideCollections.clearFilter", experiencesEnT) || "",
    cardCta: readString(t, "guideCollections.cardCta", experiencesEnT) || "",
    directionsLabel: readString(t, "guideCollections.directionsLabel", experiencesEnT) || "",
    filterHeading: readString(t, "guideCollections.filterHeading", experiencesEnT) || "",
    filterDescription: readString(t, "guideCollections.filterDescription", experiencesEnT) || "",
  };
}

function ExperiencesPageContent({ lang, topicParam = "", tagParam = "", queryString = "" }: Props) {
  const { t } = useTranslation("experiencesPage", { lng: lang });
  useTranslation("guides", { lng: lang });
  const router = useRouter();
  const { openModal } = useOptionalModal();
  usePagePreload({
    lang,
    namespaces: ["experiencesPage", "guides"],
    optionalNamespaces: ["guides.tags", "modals"],
    optional: true,
  });

  const experiencesEnT = useEnglishFallback("experiencesPage");

  const handleOpenBooking = useCallback(() => {
    fireCtaClick({ ctaId: "experiences_book_cta", ctaLocation: "experiences_page" });
    router.push(`/${lang}/book`);
  }, [router, lang]);
  const handleOpenConcierge = useCallback(() => openModal("contact"), [openModal]);

  const [clientTopicParam, setClientTopicParam] = useState(topicParam);
  const [clientTagParam, setClientTagParam] = useState(tagParam);
  const [clientQueryString, setClientQueryString] = useState(queryString);

  useEffect(() => {
    if (topicParam || tagParam || queryString) return;
    const params = new URLSearchParams(window.location.search);
    setClientTopicParam(params.get("topic") ?? "");
    setClientTagParam(params.get("tag") ?? "");
    setClientQueryString(params.toString());
  }, [queryString, tagParam, topicParam]);

  const normalizedTopicParam = clientTopicParam.trim().toLowerCase();
  const normalizedTagParam = clientTagParam.trim().toLowerCase();

  const activeFilter = normalizedTopicParam || normalizedTagParam;
  const isTagFilter = Boolean(!normalizedTopicParam && normalizedTagParam);
  const resolvedTopicId = resolveGuideTopicId(normalizedTopicParam);
  const activeFilterLabel = useMemo(() => {
    if (!activeFilter) return "";
    const value = isTagFilter ? activeFilter : resolvedTopicId ?? activeFilter;
    const meta = getTagMeta(lang, value);
    return meta.label || value;
  }, [activeFilter, isTagFilter, lang, resolvedTopicId]);

  const allExperienceGuides = useMemo(() => getExperienceGuides(), []);

  const clearFilterHref = `/${lang}/${getSlug("experiences", lang)}`;

  // Hero content
  const heroEyebrow = readString(t, "hero.eyebrow", experiencesEnT);
  const heroTitle = resolveLabel(t, "hero.title", resolveLabel(experiencesEnT, "hero.title", ""));
  const heroSubtitle = readString(t, "hero.description", experiencesEnT);
  const heroScrollNudge = readString(t, "hero.scrollNudge", experiencesEnT);

  // CTA section hrefs
  const barMenuHref = `/${lang}/${getSlug("barMenu", lang)}`;
  const breakfastMenuHref = `/${lang}/${getSlug("breakfastMenu", lang)}`;

  const guideCopy = useMemo(
    () => buildGuideCopy(t, experiencesEnT, activeFilterLabel),
    [activeFilterLabel, experiencesEnT, t]
  );

  const topicOptions = useGuideTopicOptions(allExperienceGuides, lang);

  const guideFilterTag = (() => {
    if (isTagFilter) return normalizedTagParam;
    if (!normalizedTopicParam) return null;
    return resolvedTopicId ?? normalizedTopicParam;
  })();

  const guideFilterParam = isTagFilter ? "tag" : "topic";
  const guideFilterPredicate = isTagFilter ? undefined : matchesGuideTopic;
  const guideFilterOptions = isTagFilter ? undefined : topicOptions;
  const _showGuideFilters = !isTagFilter;

  const faqTitle = readString(t, "faq.title", experiencesEnT);
  const faqItems = useMemo<GuideFaq[]>(
    () => parseFaqItems(t, experiencesEnT),
    [experiencesEnT, t]
  );

  const ctaTitle = readString(t, "cta.title", experiencesEnT);
  const ctaSubtitle = readString(t, "cta.subtitle", experiencesEnT);
  const ctaBook = readString(t, "cta.buttons.book", experiencesEnT);
  const ctaEvents = readString(t, "cta.buttons.events", experiencesEnT);
  const ctaBreakfast = readString(t, "cta.buttons.breakfast", experiencesEnT);
  const ctaConcierge = readString(t, "cta.buttons.concierge", experiencesEnT);

  return (
    <Fragment>
      <Section as="main" width="full" padding="none" className="bg-brand-surface text-brand-text dark:bg-brand-bg">
        {/* Hero */}
        <Section padding="none" width="full" className="px-4 pt-10 sm:pt-12">
          <ExperiencesHero
            eyebrow={heroEyebrow || undefined}
            title={heroTitle}
            subtitle={heroSubtitle || undefined}
            scrollNudge={heroScrollNudge || undefined}
          />
        </Section>

        {/* Guides */}
        <Section padding="none" width="full" className="px-4 pb-10">
          {isTagFilter ? (
            /* Show flat list when filtering by specific tag */
            <>
              <Section padding="none" width="full" className="mx-auto max-w-6xl">
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-sm font-medium text-brand-primary dark:bg-brand-secondary/20 dark:text-brand-secondary">
                    #{activeFilterLabel || normalizedTagParam}
                  </span>
                  <a
                    href={clearFilterHref}
                    // eslint-disable-next-line ds/min-tap-size -- BRIK-DS-001: link includes text and min dimensions; rule false-positives in this layout.
                    className="inline-flex min-h-10 min-w-10 items-center text-sm font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 dark:text-brand-secondary"
                  >
                    {guideCopy.clearFilterLabel || (t("guideCollections.clearFilter") as string)}
                  </a>
                </div>
              </Section>
              <GuideCollection
                id="experiences-guides"
                lang={lang}
                guides={allExperienceGuides}
                filterParam={guideFilterParam}
                filterTag={guideFilterTag}
                {...(guideFilterPredicate ? { filterPredicate: guideFilterPredicate } : {})}
                {...(guideFilterOptions ? { filterOptions: guideFilterOptions } : {})}
                clearFilterHref={clearFilterHref}
                basePath={clearFilterHref}
                searchParamsString={clientQueryString}
                copy={guideCopy}
                showFilters={false}
                sectionClassName="mx-auto max-w-6xl"
              />
            </>
          ) : (
            /* Show grouped layout with filter pills (handles topic filtering internally) */
            <div className="mx-auto max-w-6xl">
              <GroupedGuideCollection
                lang={lang}
                guides={allExperienceGuides}
                activeTopic={normalizedTopicParam}
                searchParamsString={clientQueryString}
                basePath={clearFilterHref}
                clearFilterHref={clearFilterHref}
                copy={{
                  cardCta: guideCopy.cardCta,
                  directionsLabel: guideCopy.directionsLabel,
                  filterHeading: guideCopy.filterHeading,
                  filterDescription: guideCopy.filterDescription,
                  clearFilterLabel: guideCopy.clearFilterLabel,
                }}
              />
            </div>
          )}
        </Section>

        {/* FAQ */}
        {faqTitle && faqItems.length ? (
          <GuideFaqSection title={faqTitle} faqs={faqItems} headingId="experiences-faq" />
        ) : null}

        {/* CTA */}
        <Section padding="none" width="full" className="px-4 pb-16">
          <ExperiencesCtaSection
            title={ctaTitle || undefined}
            subtitle={ctaSubtitle || undefined}
            bookLabel={ctaBook || undefined}
            onBookClick={handleOpenBooking}
            bookHref={`/${lang}/book`}
            eventsLabel={ctaEvents || undefined}
            eventsHref={barMenuHref}
            breakfastLabel={ctaBreakfast || undefined}
            breakfastHref={breakfastMenuHref}
            conciergeLabel={ctaConcierge || undefined}
            onConciergeClick={handleOpenConcierge}
          />
        </Section>
      </Section>

      <ContentStickyCta lang={lang} ctaLocation="experiences_page" />
    </Fragment>
  );
}

export default memo(ExperiencesPageContent);
