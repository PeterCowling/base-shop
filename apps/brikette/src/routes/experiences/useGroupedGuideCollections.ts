import { useCallback, useMemo } from "react";

import type { GuideMeta } from "@/data/guides.index";

import type { GuideCollectionCopy, GuideCollectionGroup } from "./types";
import type { ExperiencesTranslator } from "./useExperiencesTranslations";

type Translator = (key: string, options?: Record<string, unknown>) => unknown;

type Params = {
  experienceGuides: ReadonlyArray<GuideMeta>;
  guideCollectionCopy: GuideCollectionCopy;
  guideCollectionId: string;
  normalizedFilterTopic: string;
  t: Translator;
  experiencesEnT: ExperiencesTranslator;
};

export function useGroupedGuideCollections({
  experienceGuides,
  guideCollectionCopy,
  guideCollectionId,
  normalizedFilterTopic,
  t,
  experiencesEnT,
}: Params): ReadonlyArray<GuideCollectionGroup> | undefined {
  const translate = useCallback(
    (key: string, fallback: () => string, options?: Record<string, unknown>): string => {
      const translated = t(key, { ...(options ?? {}), defaultValue: "" });

      if (typeof translated === "string" && translated !== "" && translated !== key) {
        return translated;
      }

      return fallback();
    },
    [t],
  );

  return useMemo(() => {
    if (normalizedFilterTopic !== "beaches") {
      return undefined;
    }

    const withBeachesTag = experienceGuides.filter((guide) =>
      guide.tags.some((tag) => tag.toLowerCase() === "beaches"),
    );

    if (withBeachesTag.length < 2) {
      return undefined;
    }

    const guidesGroup = withBeachesTag.filter((guide) =>
      !guide.tags.some((tag) => tag.toLowerCase() === "stairs"),
    );
    const directionsGroup = withBeachesTag.filter((guide) =>
      guide.tags.some((tag) => tag.toLowerCase() === "stairs"),
    );

    if (!guidesGroup.length || !directionsGroup.length) {
      return undefined;
    }

    const beachesGuidesHeading = translate(
      "guideCollections.grouped.beaches.guides.heading",
      () => experiencesEnT("guideCollections.grouped.beaches.guides.heading"),
    );
    const beachesGuidesDescription = translate(
      "guideCollections.grouped.beaches.guides.description",
      () => experiencesEnT("guideCollections.grouped.beaches.guides.description"),
    );

    const beachesDirectionsHeading = translate(
      "guideCollections.grouped.beaches.directions.heading",
      () => experiencesEnT("guideCollections.grouped.beaches.directions.heading"),
    );
    const beachesDirectionsDescription = translate(
      "guideCollections.grouped.beaches.directions.description",
      () => experiencesEnT("guideCollections.grouped.beaches.directions.description"),
    );

    return [
      {
        id: `${guideCollectionId}-beach-guides`,
        guides: guidesGroup,
        copy: {
          ...guideCollectionCopy,
          heading: beachesGuidesHeading,
          taggedHeading: beachesGuidesHeading,
          description: beachesGuidesDescription,
          taggedDescription: beachesGuidesDescription,
        },
        showFilters: true,
      },
      {
        id: `${guideCollectionId}-beach-directions`,
        guides: directionsGroup,
        copy: {
          ...guideCollectionCopy,
          heading: beachesDirectionsHeading,
          taggedHeading: beachesDirectionsHeading,
          description: beachesDirectionsDescription,
          taggedDescription: beachesDirectionsDescription,
        },
        showFilters: false,
      },
    ] satisfies ReadonlyArray<GuideCollectionGroup>;
  }, [
    experienceGuides,
    guideCollectionCopy,
    guideCollectionId,
    normalizedFilterTopic,
    experiencesEnT,
    translate,
  ]);
}
