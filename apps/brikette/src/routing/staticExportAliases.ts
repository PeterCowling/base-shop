import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

import {
  INTERNAL_SEGMENT_BY_KEY,
  STATIC_EXPORT_SECTION_KEYS,
} from "./sectionSegments";

export type StaticAliasPair = {
  sourceBasePath: string;
  targetBasePath: string;
};

function addPair(
  pairs: StaticAliasPair[],
  seen: Set<string>,
  sourceBasePath: string,
  targetBasePath: string
): void {
  if (sourceBasePath === targetBasePath) return;

  const key = `${sourceBasePath}->${targetBasePath}`;
  if (seen.has(key)) return;
  seen.add(key);
  pairs.push({ sourceBasePath, targetBasePath });
}

function addSectionAliasPairs(
  lang: AppLanguage,
  pairs: StaticAliasPair[],
  seen: Set<string>
): void {
  for (const key of STATIC_EXPORT_SECTION_KEYS) {
    const localizedSection = getSlug(key, lang);
    const internalSection = INTERNAL_SEGMENT_BY_KEY[key];
    addPair(
      pairs,
      seen,
      `/${lang}/${localizedSection}`,
      `/${lang}/${internalSection}`
    );
  }
}

function addLocalizedTagsAliasPair(
  lang: AppLanguage,
  pairs: StaticAliasPair[],
  seen: Set<string>
): void {
  const localizedExperiences = getSlug("experiences", lang);
  const localizedGuidesTags = getSlug("guidesTags", lang);
  const internalExperiences = INTERNAL_SEGMENT_BY_KEY.experiences;
  const internalGuidesTags = INTERNAL_SEGMENT_BY_KEY.guidesTags;

  addPair(
    pairs,
    seen,
    `/${lang}/${localizedExperiences}/${localizedGuidesTags}`,
    `/${lang}/${internalExperiences}/${internalGuidesTags}`
  );
}

export function buildLocalizedStaticAliasPairs(
  languages: readonly AppLanguage[] = i18nConfig.supportedLngs as AppLanguage[]
): StaticAliasPair[] {
  const pairs: StaticAliasPair[] = [];
  const seen = new Set<string>();

  for (const lang of languages) {
    addSectionAliasPairs(lang, pairs, seen);
    addLocalizedTagsAliasPair(lang, pairs, seen);
  }

  return pairs;
}
