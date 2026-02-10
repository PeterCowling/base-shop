// src/components/guides/GroupedGuideCollection.tsx
"use client";

import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import type { GuideMeta } from "@/data/guides.index";
import { splitGuidesByType } from "@/data/guides.index";
import { matchesGuideTopic } from "@/data/guideTopics";
import appI18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";

import GroupedGuideSection, { type TopicConfig } from "./GroupedGuideSection";
import { GuideCollectionFilters } from "./GuideCollectionFilters";
import type { GuideFilterOption } from "./useGuideFilterOptions";
import { useGuideSummaryResolver } from "./useGuideSummaryResolver";

const MAIN_TOPICS = ["beaches", "hiking", "day-trip", "boat", "cuisine"] as const;
const MORE_TOPICS = ["transport", "photography", "culture"] as const;
const MIN_GUIDES_FOR_MAIN = 1;

const TOPIC_IMAGES: Record<string, string> = {
  beaches: "/img/topics/beaches.jpg",
  hiking: "/img/topics/hiking.jpg",
  "day-trip": "/img/topics/day-trip.jpg",
  boat: "/img/topics/boat.jpg",
  cuisine: "/img/topics/cuisine.jpg",
  more: "/img/topics/more.jpg",
};

const TOPIC_LABELS: Record<string, string> = {
  beaches: "Beaches",
  hiking: "Hiking",
  "day-trip": "Day trips",
  boat: "Boat tours",
  cuisine: "Food & Drink",
  more: "More",
};

type GroupedGuides = Record<string, GuideMeta[]>;
type Translator = TFunction;

export type GroupedGuideCollectionProps = {
  lang: AppLanguage;
  guides: GuideMeta[];
  activeTopic?: string;
  searchParamsString?: string;
  basePath?: string;
  copy: {
    cardCta?: string;
    directionsLabel?: string;
    filterHeading?: string;
    filterDescription?: string;
    clearFilterLabel?: string;
  };
  clearFilterHref?: string;
};

type TopicGuideSectionListProps = {
  keyPrefix: "content" | "directions";
  topics: TopicConfig[];
  groupedGuides: GroupedGuides;
  lang: AppLanguage;
  translate: Translator;
  fallbackTranslate: Translator;
  cardCtaTemplate?: string;
  directionsLabel?: string;
  resolveSummary: (guide: GuideMeta) => string;
};

function createEmptyTopicGroups(): GroupedGuides {
  const groups: GroupedGuides = { more: [] };
  for (const topicId of [...MAIN_TOPICS, ...MORE_TOPICS]) {
    groups[topicId] = [];
  }
  return groups;
}

function groupGuidesByTopic(guidesToGroup: GuideMeta[]): GroupedGuides {
  const groups = createEmptyTopicGroups();

  for (const guide of guidesToGroup) {
    let assigned = false;

    for (const topicId of MAIN_TOPICS) {
      if (matchesGuideTopic(guide, topicId)) {
        groups[topicId].push(guide);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      for (const topicId of MORE_TOPICS) {
        if (matchesGuideTopic(guide, topicId)) {
          groups.more.push(guide);
          assigned = true;
          break;
        }
      }
    }

    if (!assigned) {
      groups.more.push(guide);
    }
  }

  return groups;
}

function combineGroupedGuides(content: GroupedGuides, directions: GroupedGuides): GroupedGuides {
  const combined: GroupedGuides = {};
  for (const topicId of [...MAIN_TOPICS, "more"]) {
    combined[topicId] = [...(content[topicId] || []), ...(directions[topicId] || [])];
  }
  return combined;
}

function buildFilterOptions(groupedGuides: GroupedGuides): GuideFilterOption[] {
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

  const moreCount = groupedGuides.more?.length ?? 0;
  if (moreCount > 0) {
    options.push({
      value: "more",
      label: TOPIC_LABELS.more,
      count: moreCount,
    });
  }

  return options;
}

function readGroupedCopy(t: Translator, topicId: string, field: string): string {
  const key = `guideCollections.grouped.${topicId}.${field}`;
  const value = t(key, { ns: "experiencesPage" });
  return value !== key ? value : "";
}

function readOptionalCopy(t: Translator, key: string): string {
  const value = t(key, { ns: "experiencesPage" });
  return value !== key ? value : "";
}

function buildTopicConfigs(groupedGuides: GroupedGuides, t: Translator): TopicConfig[] {
  const configs: TopicConfig[] = [];

  for (const topicId of MAIN_TOPICS) {
    const topicGuides = groupedGuides[topicId] || [];
    if (topicGuides.length < MIN_GUIDES_FOR_MAIN) continue;

    const title = readGroupedCopy(t, topicId, "title") || TOPIC_LABELS[topicId] || topicId;
    configs.push({
      id: topicId,
      title,
      description: readGroupedCopy(t, topicId, "description"),
      imageSrc: TOPIC_IMAGES[topicId] || TOPIC_IMAGES.more,
      imageAlt: readGroupedCopy(t, topicId, "imageAlt") || title,
    });
  }

  const moreGuides = groupedGuides.more || [];
  if (moreGuides.length > 0) {
    const moreTitle = readGroupedCopy(t, "more", "title") || TOPIC_LABELS.more;
    configs.push({
      id: "more",
      title: moreTitle,
      description: readGroupedCopy(t, "more", "description"),
      imageSrc: TOPIC_IMAGES.more,
      imageAlt: readGroupedCopy(t, "more", "imageAlt") || moreTitle,
    });
  }

  return configs;
}

function filterTopicConfigsForSection(
  topicConfigs: TopicConfig[],
  sectionGuides: GroupedGuides,
  activeTopic: string,
): TopicConfig[] {
  const hasPublishedGuides = (topicId: string): boolean => {
    const guides = sectionGuides[topicId];
    return Array.isArray(guides) && guides.length > 0;
  };

  if (activeTopic) {
    return topicConfigs.filter((config) => config.id === activeTopic && hasPublishedGuides(config.id));
  }
  return topicConfigs.filter((config) => hasPublishedGuides(config.id));
}

function resolveFallbackGuidesTranslator(): Translator {
  const getFixedT = appI18n?.getFixedT;
  if (typeof getFixedT === "function") {
    const resolved = getFixedT.call(appI18n, "en", "guides");
    if (typeof resolved === "function") {
      return resolved as Translator;
    }
  }
  return (((_key: string) => "") as unknown) as Translator;
}

function TopicGuideSectionList({
  keyPrefix,
  topics,
  groupedGuides,
  lang,
  translate,
  fallbackTranslate,
  cardCtaTemplate,
  directionsLabel,
  resolveSummary,
}: TopicGuideSectionListProps): JSX.Element {
  return (
    <div className="space-y-12">
      {topics.map((topic) => {
        const topicGuides = groupedGuides[topic.id] || [];
        if (!topicGuides.length) return null;

        return (
          <GroupedGuideSection
            key={`${keyPrefix}-${topic.id}`}
            topic={topic}
            guides={topicGuides}
            lang={lang}
            translate={translate}
            fallbackTranslate={fallbackTranslate}
            cardCtaTemplate={cardCtaTemplate}
            directionsLabel={directionsLabel}
            resolveSummary={resolveSummary}
          />
        );
      })}
    </div>
  );
}

function GroupedGuideCollection({
  lang,
  guides,
  activeTopic = "",
  searchParamsString = "",
  basePath = "",
  copy,
  clearFilterHref,
}: GroupedGuideCollectionProps): JSX.Element {
  const { t, i18n } = useTranslation(["guides", "experiencesPage"], { lng: lang });
  const normalizedTopicParam = activeTopic.trim().toLowerCase();
  const searchString = searchParamsString.replace(/^\?/, "");
  const resolvedBasePath = clearFilterHref || basePath;

  const makeHref = useCallback(
    (value: string | null): string => {
      const params = new URLSearchParams(searchString);
      if (value) params.set("topic", value);
      else params.delete("topic");
      params.delete("tag");
      const query = params.toString();
      return `${resolvedBasePath}${query ? `?${query}` : ""}`;
    },
    [resolvedBasePath, searchString],
  );

  const fallbackGuidesT = useMemo(() => resolveFallbackGuidesTranslator(), []);
  const summaryResolver = useGuideSummaryResolver(i18n, lang);
  const resolveSummary = useMemo(
    () => (guide: GuideMeta) => summaryResolver(guide.key) ?? "",
    [summaryResolver],
  );

  const { contentGuides, directionsGuides } = useMemo(() => splitGuidesByType(guides), [guides]);
  const groupedContentGuides = useMemo(() => groupGuidesByTopic(contentGuides), [contentGuides]);
  const groupedDirectionsGuides = useMemo(() => groupGuidesByTopic(directionsGuides), [directionsGuides]);
  const groupedGuides = useMemo(
    () => combineGroupedGuides(groupedContentGuides, groupedDirectionsGuides),
    [groupedContentGuides, groupedDirectionsGuides],
  );

  const filterOptions = useMemo(() => buildFilterOptions(groupedGuides), [groupedGuides]);
  const topicConfigs = useMemo(() => buildTopicConfigs(groupedGuides, t), [groupedGuides, t]);
  const contentTopicConfigs = useMemo(
    () => filterTopicConfigsForSection(topicConfigs, groupedContentGuides, normalizedTopicParam),
    [topicConfigs, groupedContentGuides, normalizedTopicParam],
  );
  const directionsTopicConfigs = useMemo(
    () => filterTopicConfigsForSection(topicConfigs, groupedDirectionsGuides, normalizedTopicParam),
    [topicConfigs, groupedDirectionsGuides, normalizedTopicParam],
  );

  const translate = useMemo(() => t as Translator, [t]);
  const filterHeading = copy.filterHeading || readOptionalCopy(t as Translator, "guideCollections.filters.heading");
  const filterDescription = copy.filterDescription || "";
  const clearFilterLabel =
    copy.clearFilterLabel || readOptionalCopy(t as Translator, "guideCollections.filters.all");
  const showDirectionsSection = normalizedTopicParam !== "beaches";

  return (
    <div id="guides" className="space-y-8">
      {filterOptions.length > 1 ? (
        <GuideCollectionFilters
          heading={filterHeading}
          description={filterDescription}
          label={filterHeading}
          allHref={makeHref(null)}
          clearFilterLabel={clearFilterLabel}
          totalCount={guides.length}
          options={filterOptions}
          activeTag={normalizedTopicParam}
          makeHref={makeHref}
        />
      ) : null}

      {contentGuides.length > 0 && contentTopicConfigs.length > 0 ? (
        <TopicGuideSectionList
          keyPrefix="content"
          topics={contentTopicConfigs}
          groupedGuides={groupedContentGuides}
          lang={lang}
          translate={translate}
          fallbackTranslate={fallbackGuidesT}
          cardCtaTemplate={copy.cardCta}
          directionsLabel={copy.directionsLabel}
          resolveSummary={resolveSummary}
        />
      ) : null}

      {showDirectionsSection && directionsGuides.length > 0 && directionsTopicConfigs.length > 0 ? (
        <TopicGuideSectionList
          keyPrefix="directions"
          topics={directionsTopicConfigs}
          groupedGuides={groupedDirectionsGuides}
          lang={lang}
          translate={translate}
          fallbackTranslate={fallbackGuidesT}
          cardCtaTemplate={copy.cardCta}
          directionsLabel={copy.directionsLabel}
          resolveSummary={resolveSummary}
        />
      ) : null}
    </div>
  );
}

export default memo(GroupedGuideCollection);
