// src/components/guides/GuideCollection.types.ts
import type { AppLanguage } from "@/i18n.config";
import type { GuideMeta } from "@/data/guides.index";

export type GuideCollectionCopy = {
  heading: string;
  description?: string;
  taggedHeading?: string;
  taggedDescription?: string;
  emptyMessage?: string;
  clearFilterLabel?: string;
  cardCta?: string;
  filterHeading?: string;
  filterDescription?: string;
};

export interface GuideCollectionProps {
  lang: AppLanguage;
  guides: readonly GuideMeta[];
  id?: string;
  filterTag?: string | null;
  clearFilterHref?: string;
  copy: GuideCollectionCopy;
  showFilters?: boolean;
}

export type GuideSummaryResolver = (key: GuideMeta["key"]) => string | undefined;
