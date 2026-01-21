import { useCallback, useMemo } from "react";

import type { GuideCollectionCopy } from "./types";
import type { ExperiencesTranslator } from "./useExperiencesTranslations";

type Translator = (key: string, options?: Record<string, unknown>) => unknown;

type Params = {
  filterTagDisplay?: string;
  t: Translator;
  experiencesEnT: ExperiencesTranslator;
};

export function useGuideCollectionCopy({
  filterTagDisplay,
  t,
  experiencesEnT,
}: Params): GuideCollectionCopy {
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

  return useMemo<GuideCollectionCopy>(() => {
    const heading = translate("guideCollections.heading", () =>
      experiencesEnT("guideCollections.heading"),
    );
    const description = translate("guideCollections.description", () =>
      experiencesEnT("guideCollections.description"),
    );
    const cardCta = translate("guideCollections.cardCta", () =>
      experiencesEnT("guideCollections.cardCta"),
    );
    const directionsLabel = translate("guideCollections.directionsLabel", () =>
      experiencesEnT("guideCollections.directionsLabel"),
    );
    const filterHeading = translate("guideCollections.filterHeading", () =>
      experiencesEnT("guideCollections.filterHeading"),
    );
    const filterDescription = translate("guideCollections.filterDescription", () =>
      experiencesEnT("guideCollections.filterDescription"),
    );

    const taggedHeading = filterTagDisplay
      ? translate(
          "guideCollections.taggedHeading",
          () => experiencesEnT("guideCollections.taggedHeading", { tag: filterTagDisplay }),
          { tag: filterTagDisplay },
        )
      : undefined;

    const taggedDescription = filterTagDisplay
      ? translate(
          "guideCollections.taggedDescription",
          () =>
            experiencesEnT("guideCollections.taggedDescription", { tag: filterTagDisplay }),
          { tag: filterTagDisplay },
        )
      : undefined;

    const emptyMessage = filterTagDisplay
      ? translate(
          "guideCollections.empty",
          () => experiencesEnT("guideCollections.empty", { tag: filterTagDisplay }),
          { tag: filterTagDisplay },
        )
      : undefined;

    const clearFilterLabel = translate("guideCollections.clearFilter", () =>
      experiencesEnT("guideCollections.clearFilter"),
    );

    return {
      heading,
      description,
      clearFilterLabel,
      cardCta,
      directionsLabel,
      filterHeading,
      filterDescription,
      ...(taggedHeading ? { taggedHeading } : {}),
      ...(taggedDescription ? { taggedDescription } : {}),
      ...(emptyMessage ? { emptyMessage } : {}),
    } as const;
  }, [experiencesEnT, filterTagDisplay, translate]);
}
