/* src/routes/experiences/components/_GuideCollectionSection.tsx */
import GuideCollection from "@/components/guides/GuideCollection";
import { useGuideTopicOptions } from "@/components/guides/useGuideTopicOptions";
import type { GuideMeta } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";
import { matchesGuideTopic } from "@/data/guideTopics";
import type { GuideCollectionProps } from "@/components/guides/GuideCollection.types";
import type { GuideCollectionCopy } from "../types";

type GuideCollectionSectionProps = {
  id: string;
  lang: AppLanguage;
  guides: readonly GuideMeta[];
  totalCount: number;
  filterTag: string | null;
  filterParam: NonNullable<GuideCollectionProps["filterParam"]>;
  clearFilterHref: string;
  copy: GuideCollectionCopy;
  filterPredicate?: GuideCollectionProps["filterPredicate"];
  showFilters?: boolean;
};

export function GuideCollectionSection({
  id,
  lang,
  guides,
  totalCount,
  filterTag,
  filterParam,
  clearFilterHref,
  copy,
  filterPredicate,
  showFilters,
}: GuideCollectionSectionProps) {
  const topicOptions = useGuideTopicOptions(guides, lang);
  const filterOptions = filterParam === "topic" ? topicOptions : undefined;
  const filterOptionsProps = filterOptions ? { filterOptions } : {};
  const filterPredicateValue =
    filterPredicate ?? (filterParam === "topic" ? matchesGuideTopic : undefined);
  const filterPredicateProps = filterPredicateValue ? { filterPredicate: filterPredicateValue } : {};
  return (
    <GuideCollection
      id={id}
      lang={lang}
      guides={guides}
      totalCount={totalCount}
      filterTag={filterTag}
      filterParam={filterParam}
      {...filterOptionsProps}
      {...filterPredicateProps}
      clearFilterHref={clearFilterHref}
      // i18n-exempt -- TECH-000 [ttl=2026-12-31] Utility classes for layout spacing
      sectionClassName="md:px-12 lg:px-16"
      copy={copy}
      showFilters={showFilters ?? true}
    />
  );
}
