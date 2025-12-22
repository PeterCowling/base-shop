import { useMemo } from "react";

import type { AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

import type { HeroCta, ExperiencesPageViewModel } from "./types";
import type { ExperiencesTranslator } from "./useExperiencesTranslations";

type Translator = (key: string, options?: Record<string, unknown>) => unknown;

type TokenTranslator = (key: string, options?: Record<string, unknown>) => unknown;

type BuildCtaParams = {
  t: Translator;
  experiencesEnT: ExperiencesTranslator;
};

type BuildCtaLinksParams = {
  cta: ExperiencesPageViewModel["cta"];
  lang: AppLanguage;
  tokenBookNow: string;
};

type BuildHeroCtasParams = {
  hero: ExperiencesPageViewModel["hero"];
  lang: AppLanguage;
  tokenBookNow: string;
};

export function useCta({ t, experiencesEnT }: BuildCtaParams): ExperiencesPageViewModel["cta"] {
  return useMemo(
    () => ({
      title: t("cta.title") as string,
      subtitle: t("cta.subtitle") as string,
      buttons: {
        book: t("cta.buttons.book", {
          defaultValue: experiencesEnT("cta.buttons.book"),
        }) as string,
        events: t("cta.buttons.events", {
          defaultValue: experiencesEnT("cta.buttons.events"),
        }) as string,
        breakfast: t("cta.buttons.breakfast", {
          defaultValue: experiencesEnT("cta.buttons.breakfast"),
        }) as string,
        concierge: t("cta.buttons.concierge", {
          defaultValue: experiencesEnT("cta.buttons.concierge"),
        }) as string,
      },
    }),
    [experiencesEnT, t],
  );
}

export function useTokenBookNow(tTokens: TokenTranslator): string {
  return (tTokens("bookNow") as string) ?? "";
}

export function useCtaLinks({
  cta,
  lang,
  tokenBookNow,
}: BuildCtaLinksParams): ExperiencesPageViewModel["ctaLinks"] {
  return useMemo<ExperiencesPageViewModel["ctaLinks"]>(
    () => ({
      book: {
        label: tokenBookNow && tokenBookNow !== "bookNow" ? tokenBookNow : cta.buttons.book,
        to: `/${lang}/${getSlug("rooms", lang)}`,
      },
      events: {
        label: cta.buttons.events,
        to: `/${lang}/${getSlug("barMenu", lang)}`,
      },
      breakfast: {
        label: cta.buttons.breakfast,
        to: `/${lang}/${getSlug("breakfastMenu", lang)}`,
      },
      concierge: {
        label: cta.buttons.concierge,
        to: `/${lang}/${getSlug("assistance", lang)}`,
      },
    }),
    [cta, lang, tokenBookNow],
  );
}

export function useHeroCtas({ hero, lang, tokenBookNow }: BuildHeroCtasParams): HeroCta[] {
  return useMemo<HeroCta[]>(() => {
    return [
      {
        label: tokenBookNow && tokenBookNow !== "bookNow" ? tokenBookNow : hero.primaryCta,
        aria: hero.primaryCtaAria,
        to: `/${lang}/${getSlug("rooms", lang)}`,
      },
      {
        label: hero.secondaryCta,
        aria: hero.secondaryCtaAria,
        to: `/${lang}/${getSlug("barMenu", lang)}`,
      },
      {
        label: hero.breakfastCta,
        aria: hero.breakfastCtaAria,
        to: `/${lang}/${getSlug("breakfastMenu", lang)}`,
      },
      {
        label: hero.tertiaryCta,
        aria: hero.tertiaryCtaAria,
        to: `/${lang}/${getSlug("assistance", lang)}`,
      },
    ].filter((ctaItem) => ctaItem.label);
  }, [hero, lang, tokenBookNow]);
}
