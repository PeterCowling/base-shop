"use client";

// src/app/[lang]/apartment/ApartmentPageContent.tsx
// Client component for apartment page - migrated from routes/apartment.tsx
import { Fragment, memo } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";
import AmenitiesSection from "@acme/ui/organisms/ApartmentAmenitiesSection";
import DetailsSection from "@acme/ui/organisms/ApartmentDetailsSection";
import HeroSection from "@acme/ui/organisms/ApartmentHeroSection";
import HighlightsSection from "@acme/ui/organisms/ApartmentHighlightsSection";

import GallerySection from "@/components/apartment/GallerySection";
import ApartmentStructuredData from "@/components/seo/ApartmentStructuredData";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";

type Props = {
  lang: AppLanguage;
};

function ApartmentPageContent({ lang }: Props) {
  const { t } = useTranslation("apartmentPage", { lng: lang });
  usePagePreload({ lang, namespaces: ["apartmentPage"] });

  return (
    <Fragment>
      <ApartmentStructuredData />

      <Section padding="none" className="mx-auto max-w-6xl p-6 pt-24 sm:pt-10">
        <section className="scroll-mt-24 space-y-16">
          <h1 className="sr-only">{t("title")}</h1>
          <Section as="div" padding="none" width="full" className="mx-auto max-w-3xl">
            <p className="text-center text-brand-text md:text-lg">{t("body")}</p>
          </Section>
          <HeroSection lang={lang} />
          <HighlightsSection lang={lang} />
          <GallerySection lang={lang} />
          <AmenitiesSection lang={lang} />
          <DetailsSection lang={lang} />
        </section>
      </Section>
    </Fragment>
  );
}

export default memo(ApartmentPageContent);
