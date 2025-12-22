// src/routes/assistance/use-hub-links.ts
import { useMemo } from "react";
import type { TFunction } from "i18next";
import type { AppLanguage } from "@/i18n.config";
import { translatePath } from "@/utils/translate-path";
import { buildHubLinkContent } from "./utils";
import type { AssistanceTranslator, ExperiencesTranslator, HowToTranslator } from "./constants";

export function useHubLinks({
  lang,
  tHowTo,
  tExperiences,
  howToEnT,
  experiencesEnT,
}: {
  lang: AppLanguage;
  tHowTo: TFunction | HowToTranslator;
  tExperiences: TFunction | ExperiencesTranslator;
  howToEnT: HowToTranslator;
  experiencesEnT: ExperiencesTranslator;
}) {
  const howToLink = useMemo(() => {
    const title = tHowTo("header.title", { defaultValue: howToEnT("header.title") }) as string;
    const eyebrow = tHowTo("header.eyebrow", {
      defaultValue: howToEnT("header.eyebrow"),
    }) as string;
    const metaDescription = tHowTo("meta.description", {
      defaultValue: howToEnT("meta.description"),
    }) as string;
    const summary = tHowTo("header.description", {
      defaultValue: howToEnT("header.description"),
    }) as string;

    return buildHubLinkContent({
      eyebrow,
      title,
      summary,
      metaDescription,
      href: `/${lang}/${translatePath("howToGetHere", lang)}`,
    });
  }, [howToEnT, lang, tHowTo]);

  const experiencesLink = useMemo(() => {
    const title = tExperiences("title", {
      defaultValue: experiencesEnT("title"),
    }) as string;
    const eyebrow = tExperiences("hero.eyebrow", {
      defaultValue: experiencesEnT("hero.eyebrow"),
    }) as string;
    const metaDescription = tExperiences("meta.description", {
      defaultValue: experiencesEnT("meta.description"),
    }) as string;
    const summary = tExperiences("hero.description", {
      defaultValue: experiencesEnT("hero.description"),
    }) as string;

    return buildHubLinkContent({
      eyebrow,
      title,
      summary,
      metaDescription,
      href: `/${lang}/${translatePath("experiences", lang)}`,
    });
  }, [experiencesEnT, lang, tExperiences]);

  return { howToLink, experiencesLink } as const;
}

export function useCrosslinkCopy({
  t,
  assistanceEnT,
  howToTitle,
  experiencesTitle,
  howToMetaDescription,
  experiencesMetaDescription,
}: {
  t: AssistanceTranslator | TFunction;
  assistanceEnT: AssistanceTranslator;
  howToTitle: string;
  experiencesTitle: string;
  howToMetaDescription: string;
  experiencesMetaDescription: string;
}) {
  const crosslinkHeading = t("crosslinks.heading", {
    defaultValue: assistanceEnT("crosslinks.heading", {
      howToTitle,
      experiencesTitle,
    }),
    howToTitle,
    experiencesTitle,
  }) as string;

  const crosslinkIntroRaw = t("crosslinks.intro", {
    defaultValue: assistanceEnT("crosslinks.intro", {
      experiencesMetaDescription,
      howToMetaDescription,
    }),
    experiencesMetaDescription,
    howToMetaDescription,
  }) as string;

  return { crosslinkHeading, crosslinkIntro: crosslinkIntroRaw.trim() } as const;
}

