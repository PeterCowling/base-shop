/* src/routes/experiences/components/_GuideCollectionSection.tsx */
import GuideCollection from "@/components/guides/GuideCollection";
import type { GuideMeta } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";
import type { GuideCollectionCopy } from "../types";

type GuideCollectionSectionProps = {
  id: string;
  lang: AppLanguage;
  guides: readonly GuideMeta[];
  filterTag: string | null;
  clearFilterHref: string;
  copy: GuideCollectionCopy;
  showFilters?: boolean;
};

export function GuideCollectionSection({
  id,
  lang,
  guides,
  filterTag,
  clearFilterHref,
  copy,
  showFilters,
}: GuideCollectionSectionProps) {
  return (
    <GuideCollection
      id={id}
      lang={lang}
      guides={guides}
      filterTag={filterTag}
      clearFilterHref={clearFilterHref}
      copy={copy}
      showFilters={showFilters ?? false}
    />
  );
}
