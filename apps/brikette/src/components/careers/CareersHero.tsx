"use client";

// src/components/careers/CareersHero.tsx
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import { Button } from "@acme/design-system/primitives";

import { CfHeroImage } from "@acme/ui/atoms/CfHeroImage";
import { useModal } from "@/context/ModalContext";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { getOptionalString } from "@/utils/translationFallbacks";

const HERO_IMAGE = "/img/c2.avif";
const HERO_TITLE_ID = "careers-hero-title";
const NAMESPACES = ["translation", "careersPage"] as const;
const FALLBACK_LANGUAGE = i18nConfig.fallbackLng as AppLanguage;

interface CareersHeroProps {
  lang?: string;
}

function CareersHero({ lang }: CareersHeroProps): JSX.Element {
  const { openModal } = useModal();
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t, i18n } = useTranslation(NAMESPACES, translationOptions);
  const { t: fallbackT } = useTranslation(NAMESPACES, { lng: FALLBACK_LANGUAGE });

  const fixedEnglishT: TFunction | null = (() => {
    if (typeof i18n.getFixedT !== "function") {
      return null;
    }

    try {
      return i18n.getFixedT(FALLBACK_LANGUAGE, NAMESPACES);
    } catch {
      return null;
    }
  })();

  const resolve = useCallback(
    (key: string): string => {
      const primary = getOptionalString(t, key);
      const englishFromFixed = fixedEnglishT ? getOptionalString(fixedEnglishT, key) : undefined;
      const englishFromHook = getOptionalString(fallbackT, key);
      const englishFallback = englishFromFixed ?? englishFromHook;

      if (englishFallback === undefined) {
        return key;
      }

      return primary ?? englishFallback;
    },
    [fallbackT, fixedEnglishT, t]
  );

  const title = resolve("careers.jobTitle");
  const description = resolve("careers.jobDescription");
  const ctaLabel = resolve("careers.ctaLabel");
  const imageAlt = resolve("careersSection.altProfessional");

  const handleCtaClick = useCallback(() => {
    openModal("contact");
  }, [openModal]);

  return (
    <section
      className="relative isolate overflow-hidden bg-brand-bg text-brand-bg dark:bg-brand-text dark:text-brand-heading"
      aria-labelledby={HERO_TITLE_ID}
    >
      <div className="careers-hero-media relative w-full overflow-hidden">
        <CfHeroImage
          src={HERO_IMAGE}
          alt={imageAlt}
          width={1920}
          height={1080}
          quality={85}
          priority
          className="size-full object-cover"
        />
        <div aria-hidden className="hero-gradient-overlay" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="hero-panel careers-hero-panel mx-auto space-y-6 rounded-3xl bg-brand-text/60 px-6 py-10 text-center text-brand-bg backdrop-blur-sm sm:space-y-7 sm:px-10 dark:bg-brand-bg/70 dark:text-brand-heading">
          <h1
            id={HERO_TITLE_ID}
            className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
          >
            {title}
          </h1>

          <p className="careers-hero-description text-pretty text-base text-brand-bg/90 sm:text-lg dark:text-brand-heading/90">
            {description}
          </p>

          <div>
            <Button onClick={handleCtaClick} className="cta-light dark:cta-dark">
              {ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(CareersHero);
