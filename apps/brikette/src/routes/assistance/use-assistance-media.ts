// src/routes/assistance/use-assistance-media.ts
import { useMemo } from "react";
import type { TFunction } from "i18next";

export function useAssistanceMedia(t: TFunction, fallbackHeading: string) {
  return useMemo<Record<string, { src: string; alt: string }>>(() => {
    const localizedAlt = t("mediaAlt.aboutOurHostel", {
      defaultValue: fallbackHeading,
    }) as string;
    const aboutOurHostelAlt = localizedAlt.trim() ? localizedAlt : fallbackHeading;
    return {
      aboutOurHostel: { src: "", alt: aboutOurHostelAlt },
    };
  }, [fallbackHeading, t]);
}

