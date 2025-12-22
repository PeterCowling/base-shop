import { useMemo } from "react";

import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { ensureStringArray } from "@/utils/i18nContent";

import { SECTION_KEYS, SECTION_MEDIA } from "./constants";
import type { SectionContent } from "./types";

type Translator = (key: string, options?: Record<string, unknown>) => unknown;

type Params = {
  t: Translator;
};

export function useSectionsContent({ t }: Params): SectionContent[] {
  return useMemo<SectionContent[]>(
    () =>
      SECTION_KEYS.map((key) => {
        const highlightsRaw = t(`sections.${key}.highlights`, { returnObjects: true }) as unknown;
        return {
          key,
          eyebrow: t(`sections.${key}.eyebrow`) as string,
          title: t(`sections.${key}.title`) as string,
          description: t(`sections.${key}.description`) as string,
          highlights: ensureStringArray(highlightsRaw),
          imageAlt: t(`sections.${key}.imageAlt`) as string,
          imageSrc: buildCfImageUrl(SECTION_MEDIA[key].image, {
            width: 960,
            height: 640,
            quality: 85,
            format: "auto",
          }),
          imageRaw: SECTION_MEDIA[key].image,
        } satisfies SectionContent;
      }),
    [t],
  );
}
