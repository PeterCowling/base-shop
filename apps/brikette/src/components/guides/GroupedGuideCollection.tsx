// src/components/guides/GroupedGuideCollection.tsx
"use client";

import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePathname, useSearchParams } from "next/navigation";
import type { TFunction } from "i18next";
import clsx from "clsx";

import type { GuideMeta } from "@/data/guides.index";
import { splitGuidesByType } from "@/data/guides.index";
import { matchesGuideTopic } from "@/data/guideTopics";
import type { AppLanguage } from "@/i18n.config";
import appI18n from "@/i18n";

import { GuideCollectionFilters } from "./GuideCollectionFilters";
import GroupedGuideSection, { type TopicConfig } from "./GroupedGuideSection";
import { useGuideSummaryResolver } from "./useGuideSummaryResolver";
import type { GuideFilterOption } from "./useGuideFilterOptions";

// Section types for content vs directions split
type GuideSection = "content" | "directions";

// Topic display order and minimum guide threshold
const MAIN_TOPICS = ["beaches", "hiking", "day-trip", "boat", "cuisine", "itinerary"] as const;
const MORE_TOPICS = ["transport", "photography", "culture"] as const;
const MIN_GUIDES_FOR_MAIN = 1;

// Topic-specific images (sourced from Unsplash, stored locally)
const TOPIC_IMAGES: Record<string, string> = {
  beaches: "/img/topics/beaches.jpg",
  hiking: "/img/topics/hiking.jpg",
  "day-trip": "/img/topics/day-trip.jpg",
  boat: "/img/topics/boat.jpg",
  cuisine: "/img/topics/cuisine.jpg",
  itinerary: "/img/topics/itinerary.jpg",
  more: "/img/topics/more.jpg",
};

// Map topic IDs to display labels for filters
const TOPIC_LABELS: Record<string, string> = {
  beaches: "Beaches",
  hiking: "Hiking",
  "day-trip": "Day trips",
  boat: "Boat tours",
  cuisine: "Food & Drink",
  itinerary: "Itineraries",
  more: "More",
};

export type GroupedGuideCollectionProps = {
  lang: AppLanguage;
  guides: GuideMeta[];
  copy: {
    cardCta?: string;
    directionsLabel?: string;
    filterHeading?: string;
    filterDescription?: string;
    clearFilterLabel?: string;
  };
  clearFilterHref?: string;
};

type Translator = TFunction;

function GroupedGuideCollection({
  lang,
  guides,
  copy,
  clearFilterHref,
}: GroupedGuideCollectionProps): JSX.Element {
  const { t, i18n, ready } = useTranslation(["guides", "experiencesPage"], { lng: lang });
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get active topic from URL
  const topicParam = searchParams?.get("topic") ?? "";
  const normalizedTopicParam = topicParam.trim().toLowerCase();

  // Build href maker for filter links
  const searchString = searchParams?.toString() ?? "";
  const basePath = clearFilterHref || pathname || "";
  const makeHref = useCallback(
    (value: string | null): string => {
      const params = new URLSearchParams(searchString);
      if (value) {
        params.set("topic", value);
      } else {
        params.delete("topic");
      }
      params.delete("tag"); // Clear tag param when using topic
      const query = params.toString();
      return `${basePath}${query ? `?${query}` : ""}`;
    },
    [basePath, searchString],
  );

  // Get fixed English translator for fallback
  const getFixedT = appI18n?.getFixedT;
  const hasFixedEnglish =
    Object.hasOwn?.(appI18n as unknown as Record<string, unknown>, "getFixedT") === true &&
    typeof getFixedT === "function";
  const fallbackGuidesT = useMemo<Translator>(() => {
    if (hasFixedEnglish) {
      const resolved = getFixedT!.call(appI18n, "en", "guides");
      if (typeof resolved === "function") {
        return resolved as Translator;
      }
    }
    return (((_key: string) => "") as unknown) as Translator;
  }, [getFixedT, hasFixedEnglish]);

  const summaryResolver = useGuideSummaryResolver(i18n, lang);
  const resolveSummary = useMemo(
    () => (guide: GuideMeta) => summaryResolver(guide.key),
    [summaryResolver],
  );

  // Split guides into content vs directions
  const { contentGuides, directionsGuides } = useMemo(
    () => splitGuidesByType(guides),
    [guides],
  );

  // Get active section from URL (defaults to showing all)
  const sectionParam = searchParams?.get("section") ?? "";
  const normalizedSectionParam = sectionParam.trim().toLowerCase() as GuideSection | "";

  // Helper function to group guides by topic
  const groupByTopic = useCallback((guidesToGroup: GuideMeta[]): Record<string, GuideMeta[]> => {
    const groups: Record<string, GuideMeta[]> = {};

    // Initialize groups for all topics
    for (const topicId of [...MAIN_TOPICS, ...MORE_TOPICS]) {
      groups[topicId] = [];
    }
    groups["more"] = [];

    // Categorize each guide
    for (const guide of guidesToGroup) {
      let assigned = false;

      // Try main topics first
      for (const topicId of MAIN_TOPICS) {
        if (matchesGuideTopic(guide, topicId)) {
          groups[topicId].push(guide);
          assigned = true;
          break; // Assign to first matching topic only
        }
      }

      // If not in main topics, try more topics
      if (!assigned) {
        for (const topicId of MORE_TOPICS) {
          if (matchesGuideTopic(guide, topicId)) {
            groups["more"].push(guide);
            assigned = true;
            break;
          }
        }
      }

      // If still not assigned, add to "more"
      if (!assigned) {
        groups["more"].push(guide);
      }
    }

    return groups;
  }, []);

  // Group content and directions guides separately by topic
  const groupedContentGuides = useMemo(() => groupByTopic(contentGuides), [contentGuides, groupByTopic]);
  const groupedDirectionsGuides = useMemo(() => groupByTopic(directionsGuides), [directionsGuides, groupByTopic]);

  // Combined grouped guides for backwards compatibility (used in filter options)
  const groupedGuides = useMemo(() => {
    const groups: Record<string, GuideMeta[]> = {};
    for (const topicId of [...MAIN_TOPICS, "more"]) {
      groups[topicId] = [
        ...(groupedContentGuides[topicId] || []),
        ...(groupedDirectionsGuides[topicId] || []),
      ];
    }
    return groups;
  }, [groupedContentGuides, groupedDirectionsGuides]);

  // Build section filter options
  const sectionFilterOptions = useMemo<GuideFilterOption[]>(() => {
    const options: GuideFilterOption[] = [];

    if (contentGuides.length > 0) {
      options.push({
        value: "content",
        label: "Experience Guides",
        count: contentGuides.length,
      });
    }

    if (directionsGuides.length > 0) {
      options.push({
        value: "directions",
        label: "Getting There",
        count: directionsGuides.length,
      });
    }

    return options;
  }, [contentGuides.length, directionsGuides.length]);

  // Build topic filter options from grouped guides
  const filterOptions = useMemo<GuideFilterOption[]>(() => {
    const options: GuideFilterOption[] = [];

    for (const topicId of MAIN_TOPICS) {
      const count = groupedGuides[topicId]?.length ?? 0;
      if (count >= MIN_GUIDES_FOR_MAIN) {
        options.push({
          value: topicId,
          label: TOPIC_LABELS[topicId] || topicId,
          count,
        });
      }
    }

    // Add "more" if it has guides
    const moreCount = groupedGuides["more"]?.length ?? 0;
    if (moreCount > 0) {
      options.push({
        value: "more",
        label: TOPIC_LABELS["more"] || "More",
        count: moreCount,
      });
    }

    return options;
  }, [groupedGuides]);

  // Make href for section filter
  const makeSectionHref = useCallback(
    (value: string | null): string => {
      const params = new URLSearchParams(searchString);
      if (value) {
        params.set("section", value);
      } else {
        params.delete("section");
      }
      params.delete("topic"); // Clear topic param when changing section
      params.delete("tag");
      const query = params.toString();
      return `${basePath}${query ? `?${query}` : ""}`;
    },
    [basePath, searchString],
  );

  // Build topic configs from translations
  const topicConfigs = useMemo(() => {
    const configs: TopicConfig[] = [];

    const readGroupedCopy = (topicId: string, field: string): string => {
      const key = `guideCollections.grouped.${topicId}.${field}`;
      const value = t(key, { ns: "experiencesPage" });
      return value !== key ? value : "";
    };

    // Add main topics
    for (const topicId of MAIN_TOPICS) {
      const topicGuides = groupedGuides[topicId] || [];
      if (topicGuides.length >= MIN_GUIDES_FOR_MAIN) {
        configs.push({
          id: topicId,
          title: readGroupedCopy(topicId, "title") || TOPIC_LABELS[topicId] || topicId,
          description: readGroupedCopy(topicId, "description") || "",
          imageSrc: TOPIC_IMAGES[topicId] || TOPIC_IMAGES["more"],
          imageAlt: readGroupedCopy(topicId, "imageAlt") || `${topicId} guides`,
        });
      }
    }

    // Add "more" section if it has guides
    const moreGuides = groupedGuides["more"] || [];
    if (moreGuides.length > 0) {
      configs.push({
        id: "more",
        title: readGroupedCopy("more", "title") || "More Guides",
        description: readGroupedCopy("more", "description") || "",
        imageSrc: TOPIC_IMAGES["more"],
        imageAlt: readGroupedCopy("more", "imageAlt") || "More guides",
      });
    }

    return configs;
  }, [groupedGuides, t]);

  const translate = useMemo(() => {
    if (!ready || !i18n) return t as Translator;
    return t as Translator;
  }, [i18n, t, ready]);

  const allHref = makeHref(null);
  const allSectionsHref = makeSectionHref(null);
  const filterHeading = copy.filterHeading || "Filter by experience type";
  const filterDescription = copy.filterDescription || "";
  const clearFilterLabel = copy.clearFilterLabel || "All experiences";

  // Section labels from translations or defaults
  const contentSectionTitle = t("guideCollections.sections.content.title", { ns: "experiencesPage", defaultValue: "Experience Guides" });
  const contentSectionDescription = t("guideCollections.sections.content.description", { ns: "experiencesPage", defaultValue: "In-depth guides about places, experiences, and things to do" });
  const directionsSectionTitle = t("guideCollections.sections.directions.title", { ns: "experiencesPage", defaultValue: "Getting There" });
  const directionsSectionDescription = t("guideCollections.sections.directions.description", { ns: "experiencesPage", defaultValue: "Step-by-step directions to and from the hostel" });

  // Filter topic configs based on section
  const getFilteredTopicConfigsForSection = (
    sectionGuides: Record<string, GuideMeta[]>,
  ): TopicConfig[] => {
    if (normalizedTopicParam) {
      return topicConfigs.filter(
        (config) => config.id === normalizedTopicParam && (sectionGuides[config.id]?.length ?? 0) > 0,
      );
    }
    return topicConfigs.filter((config) => (sectionGuides[config.id]?.length ?? 0) > 0);
  };

  const contentTopicConfigs = getFilteredTopicConfigsForSection(groupedContentGuides);
  const directionsTopicConfigs = getFilteredTopicConfigsForSection(groupedDirectionsGuides);

  // Determine which sections to show based on section filter
  const showContentSection = !normalizedSectionParam || normalizedSectionParam === "content";
  const showDirectionsSection = !normalizedSectionParam || normalizedSectionParam === "directions";

  // Section header styles
  const SECTION_HEADER_CLASSES = [
    "mb-6",
    "rounded-xl",
    "border",
    "border-brand-outline/30",
    "bg-brand-surface/50",
    "p-4",
    "dark:border-brand-outline/40",
    "dark:bg-brand-text/5",
  ] as const;

  return (
    <div id="guides" className="space-y-8">
      {/* Section filter pills */}
      {sectionFilterOptions.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={allSectionsHref}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
              !normalizedSectionParam
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary dark:border-brand-secondary/70 dark:bg-brand-secondary/20 dark:text-brand-secondary"
                : "border-brand-outline/40 text-brand-paragraph hover:border-brand-primary/50 hover:text-brand-primary dark:border-brand-outline/60 dark:text-brand-muted dark:hover:border-brand-secondary/60 dark:hover:text-brand-secondary",
            )}
          >
            All
            <span className="rounded-full bg-brand-surface/80 px-2 py-0.5 text-xs font-semibold text-brand-muted dark:bg-brand-text/15">
              {guides.length}
            </span>
          </a>
          {sectionFilterOptions.map((option) => (
            <a
              key={option.value}
              href={makeSectionHref(option.value)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                normalizedSectionParam === option.value
                  ? "border-brand-primary bg-brand-primary/10 text-brand-primary dark:border-brand-secondary/70 dark:bg-brand-secondary/20 dark:text-brand-secondary"
                  : "border-brand-outline/40 text-brand-paragraph hover:border-brand-primary/50 hover:text-brand-primary dark:border-brand-outline/60 dark:text-brand-muted dark:hover:border-brand-secondary/60 dark:hover:text-brand-secondary",
              )}
            >
              {option.label}
              <span className="rounded-full bg-brand-surface/80 px-2 py-0.5 text-xs font-semibold text-brand-muted dark:bg-brand-text/15">
                {option.count}
              </span>
            </a>
          ))}
        </div>
      ) : null}

      {/* Topic filter panel */}
      {filterOptions.length > 1 ? (
        <GuideCollectionFilters
          heading={filterHeading}
          description={filterDescription}
          label={filterHeading}
          allHref={allHref}
          clearFilterLabel={clearFilterLabel}
          totalCount={guides.length}
          options={filterOptions}
          activeTag={normalizedTopicParam}
          makeHref={makeHref}
        />
      ) : null}

      {/* Content guides section */}
      {showContentSection && contentGuides.length > 0 && contentTopicConfigs.length > 0 ? (
        <div className="space-y-8">
          <div className={clsx(SECTION_HEADER_CLASSES)}>
            <h2 className="text-xl font-bold text-brand-heading dark:text-brand-heading">
              {contentSectionTitle}
            </h2>
            <p className="mt-1 text-sm text-brand-paragraph dark:text-brand-muted">
              {contentSectionDescription}
            </p>
          </div>
          <div className="space-y-12">
            {contentTopicConfigs.map((topic) => {
              const topicGuides = groupedContentGuides[topic.id] || [];
              if (!topicGuides.length) return null;

              return (
                <GroupedGuideSection
                  key={`content-${topic.id}`}
                  topic={topic}
                  guides={topicGuides}
                  lang={lang}
                  translate={translate}
                  fallbackTranslate={fallbackGuidesT}
                  cardCtaTemplate={copy.cardCta}
                  directionsLabel={copy.directionsLabel}
                  resolveSummary={resolveSummary}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Directions guides section */}
      {showDirectionsSection && directionsGuides.length > 0 && directionsTopicConfigs.length > 0 ? (
        <div className="space-y-8">
          <div className={clsx(SECTION_HEADER_CLASSES)}>
            <h2 className="text-xl font-bold text-brand-heading dark:text-brand-heading">
              {directionsSectionTitle}
            </h2>
            <p className="mt-1 text-sm text-brand-paragraph dark:text-brand-muted">
              {directionsSectionDescription}
            </p>
          </div>
          <div className="space-y-12">
            {directionsTopicConfigs.map((topic) => {
              const topicGuides = groupedDirectionsGuides[topic.id] || [];
              if (!topicGuides.length) return null;

              return (
                <GroupedGuideSection
                  key={`directions-${topic.id}`}
                  topic={topic}
                  guides={topicGuides}
                  lang={lang}
                  translate={translate}
                  fallbackTranslate={fallbackGuidesT}
                  cardCtaTemplate={copy.cardCta}
                  directionsLabel={copy.directionsLabel}
                  resolveSummary={resolveSummary}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default memo(GroupedGuideCollection);
