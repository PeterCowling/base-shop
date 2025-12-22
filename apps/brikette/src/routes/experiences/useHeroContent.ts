import { useMemo } from "react";

import type { HeroContent } from "./types";
import type { ExperiencesTranslator } from "./useExperiencesTranslations";

type Translator = (key: string, options?: Record<string, unknown>) => unknown;

type TokenTranslator = (key: string, options?: Record<string, unknown>) => unknown;

type Params = {
  t: Translator;
  tTokens: TokenTranslator;
  experiencesEnT: ExperiencesTranslator;
};

export function useHeroContent({ t, tTokens, experiencesEnT }: Params): HeroContent {
  return useMemo<HeroContent>(
    () => ({
      eyebrow: t("hero.eyebrow") as string,
      title: t("hero.title") as string,
      description: t("hero.description") as string,
      supporting: t("hero.supporting") as string,
      primaryCta: t("hero.primaryCta") as string,
      secondaryCta: (() => {
        const obm = tTokens("openBarMenu") as string;
        if (obm && obm !== "openBarMenu") return obm;
        return t("hero.secondaryCta", {
          defaultValue: experiencesEnT("hero.secondaryCta"),
        }) as string;
      })(),
      breakfastCta: t("hero.breakfastCta", {
        defaultValue: experiencesEnT("hero.breakfastCta"),
      }) as string,
      tertiaryCta: t("hero.tertiaryCta") as string,
      primaryCtaAria: t("hero.primaryCtaAria") as string,
      secondaryCtaAria: t("hero.secondaryCtaAria", {
        defaultValue: experiencesEnT("hero.secondaryCtaAria"),
      }) as string,
      breakfastCtaAria: t("hero.breakfastCtaAria", {
        defaultValue: experiencesEnT("hero.breakfastCtaAria"),
      }) as string,
      tertiaryCtaAria: t("hero.tertiaryCtaAria") as string,
    }),
    [experiencesEnT, t, tTokens],
  );
}
