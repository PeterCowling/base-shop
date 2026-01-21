import { useCallback, useMemo } from "react";
import type { TFunction } from "i18next";

import type { AssistanceTranslator, GuideCollectionCopy } from "./constants";

function interpolateTag(
  value: string | undefined,
  filterTagDisplay: string | undefined
): string | undefined {
  if (!value || !filterTagDisplay) {
    return value;
  }

  let next = value;
  if (next.includes("{{tag}}")) {
    next = next.replaceAll("{{tag}}", filterTagDisplay);
  }
  if (next.includes("{tag}")) {
    next = next.replaceAll("{tag}", filterTagDisplay);
  }
  return next;
}

interface GuideCollectionCopyOptions {
  t: TFunction<"assistanceSection">;
  assistanceEnT: AssistanceTranslator;
  filterTagDisplay?: string;
}

export function useGuideCollectionCopy({
  t,
  assistanceEnT,
  filterTagDisplay,
}: GuideCollectionCopyOptions): GuideCollectionCopy {
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
    const heading = translate("guideCollections.heading", () =>
      assistanceEnT("guideCollections.heading"),
    );
    const description = translate("guideCollections.description", () =>
      assistanceEnT("guideCollections.description"),
    );
    const cardCta = translate("guideCollections.cardCta", () =>
      assistanceEnT("guideCollections.cardCta"),
    );

    const taggedHeading = filterTagDisplay
      ? translate(
          "guideCollections.taggedHeading",
          () => assistanceEnT("guideCollections.taggedHeading", { tag: filterTagDisplay }),
          { tag: filterTagDisplay },
        )
      : undefined;

    const taggedDescription = filterTagDisplay
      ? translate(
          "guideCollections.taggedDescription",
          () =>
            assistanceEnT("guideCollections.taggedDescription", { tag: filterTagDisplay }),
          { tag: filterTagDisplay },
        )
      : undefined;

    const emptyMessage = filterTagDisplay
      ? translate(
          "guideCollections.empty",
          () => assistanceEnT("guideCollections.empty", { tag: filterTagDisplay }),
          { tag: filterTagDisplay },
        )
      : undefined;

    const clearFilterLabel = translate("guideCollections.clearFilter", () =>
      assistanceEnT("guideCollections.clearFilter"),
    );

    const taggedHeadingValue = interpolateTag(taggedHeading, filterTagDisplay);
    const taggedDescriptionValue = interpolateTag(taggedDescription, filterTagDisplay);
    const emptyMessageValue = interpolateTag(emptyMessage, filterTagDisplay);

    return {
      heading,
      description,
      clearFilterLabel,
      cardCta,
      ...(taggedHeadingValue !== undefined ? { taggedHeading: taggedHeadingValue } : {}),
      ...(taggedDescriptionValue !== undefined ? { taggedDescription: taggedDescriptionValue } : {}),
      ...(emptyMessageValue !== undefined ? { emptyMessage: emptyMessageValue } : {}),
    } as const;
  }, [assistanceEnT, filterTagDisplay, translate]);
}
