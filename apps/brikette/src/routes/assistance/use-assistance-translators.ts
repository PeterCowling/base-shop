import { useMemo } from "react";

import i18n from "@/i18n";

import {
  type AssistanceTranslator,
  type ExperiencesTranslator,
  type HowToTranslator,
} from "./constants";

export function useEnglishAssistanceTranslators() {
  const assistanceEnT = useMemo<AssistanceTranslator>(() => {
    try {
      const t = i18n.getFixedT("en", "assistanceSection");
      return (typeof t === "function" ? t : ((k: string, _o?: unknown) => k)) as AssistanceTranslator;
    } catch {
      return ((k: string) => k) as AssistanceTranslator;
    }
  }, []);

  const howToEnT = useMemo<HowToTranslator>(() => {
    try {
      const t = i18n.getFixedT("en", "howToGetHere");
      return (typeof t === "function" ? t : ((k: string, _o?: unknown) => k)) as HowToTranslator;
    } catch {
      return ((k: string) => k) as HowToTranslator;
    }
  }, []);

  const experiencesEnT = useMemo<ExperiencesTranslator>(() => {
    try {
      const t = i18n.getFixedT("en", "experiencesPage");
      return (typeof t === "function" ? t : ((k: string, _o?: unknown) => k)) as ExperiencesTranslator;
    } catch {
      return ((k: string) => k) as ExperiencesTranslator;
    }
  }, []);

  return {
    assistanceEnT,
    howToEnT,
    experiencesEnT,
  } as const;
}
