// src/components/guides/GuideCollection.types.ts
import type { GuideMeta } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";

import type { GuideFilterOption } from "./useGuideFilterOptions";

export type GuideCollectionCopy = {
  heading: string;
  description?: string;
  taggedHeading?: string;
  taggedDescription?: string;
  emptyMessage?: string;
  clearFilterLabel?: string;
  cardCta?: string;
  directionsLabel?: string;
  filterHeading?: string;
  filterDescription?: string;
};

export interface GuideCollectionProps {
  lang: AppLanguage;
  guides: readonly GuideMeta[];
  id?: string;
  totalCount?: number;
  filterTag?: string | null;
  filterParam?: string;
  filterOptions?: readonly GuideFilterOption[];
  filterPredicate?: (guide: GuideMeta, normalizedFilter: string) => boolean;
  clearFilterHref?: string;
  sectionClassName?: string;
  copy: GuideCollectionCopy;
  showFilters?: boolean;
}

export type GuideSummaryResolver = (key: GuideMeta["key"]) => string | undefined;
