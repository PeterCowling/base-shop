"use client";

// src/app/[lang]/apartment/ApartmentPageContent.tsx
// Client component for apartment page - migrated from routes/apartment.tsx
import { Fragment, memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import { Section } from "@acme/design-system/atoms";
import AmenitiesSection from "@acme/ui/organisms/ApartmentAmenitiesSection";
import DetailsSection from "@acme/ui/organisms/ApartmentDetailsSection";
import HeroSection from "@acme/ui/organisms/ApartmentHeroSection";
import HighlightsSection from "@acme/ui/organisms/ApartmentHighlightsSection";

import FitCheck from "@/components/apartment/FitCheck";
import GallerySection from "@/components/apartment/GallerySection";
import ApartmentStructuredData from "@/components/seo/ApartmentStructuredData";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { fireViewItem } from "@/utils/ga4-events";
import { trackApartmentEvent } from "@/utils/trackApartmentEvent";

type Props = {
  lang: AppLanguage;
};

const WHATSAPP_URL = "https://wa.me/393287073695";

function ApartmentPageContent({ lang }: Props) {
  const { t } = useTranslation("apartmentPage", { lng: lang });
  usePagePreload({ lang, namespaces: ["apartmentPage"] });

  // Fire view_item once per navigation
  useEffect(() => {
    fireViewItem({ itemId: "apartment", itemName: "apartment" });
  }, []);

  return (
    <Fragment>
      <ApartmentStructuredData />

      <Section padding="none" className="mx-auto max-w-6xl p-6 pt-24 sm:pt-10">
        <section className="scroll-mt-24 space-y-16">
          <HeroSection lang={lang} />
          <h1 className="sr-only">{t("title")}</h1>
          <Section as="div" padding="none" width="full" className="mx-auto max-w-3xl">
            <p className="text-center text-brand-text md:text-lg">{t("body")}</p>
          </Section>

          {/* Intent-routing cards */}
          <Section as="div" padding="none" width="full" className="mx-auto max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href={`/${lang}/apartment/street-level-arrival/`}
                className="group rounded-2xl border border-brand-outline/30 bg-panel/90 p-5 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="mb-1 text-lg font-semibold text-brand-heading">
                      {t("hub.streetLevelCard.title")}
                    </h2>
                    <p className="mb-3 text-sm text-brand-text">
                      {t("hub.streetLevelCard.subtitle")}
                    </p>
                    <span className="text-sm font-medium text-brand-primary">
                      {t("hub.streetLevelCard.cta")} →
                    </span>
                  </div>
                </div>
              </Link>

              <Link
                href={`/${lang}/apartment/private-stay/`}
                className="group rounded-2xl border border-brand-outline/30 bg-panel/90 p-5 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="mb-1 text-lg font-semibold text-brand-heading">
                      {t("hub.privateStayCard.title")}
                    </h2>
                    <p className="mb-3 text-sm text-brand-text">
                      {t("hub.privateStayCard.subtitle")}
                    </p>
                    <span className="text-sm font-medium text-brand-primary">
                      {t("hub.privateStayCard.cta")} →
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </Section>

          {/* FitCheck component */}
          <Section as="div" padding="none" width="full" className="mx-auto max-w-3xl">
            <FitCheck />
          </Section>

          {/* CTAs */}
          <Section as="div" padding="none" width="full" className="mx-auto max-w-3xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href={`/${lang}/apartment/book/`}
                onClick={() => trackApartmentEvent("click_check_availability", { source: "hub" })}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-brand-primary px-8 py-3 text-base font-semibold text-fg-inverse shadow-sm transition-colors hover:bg-brand-primary/90 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-brand-primary focus-visible:focus:ring-offset-2"
              >
                {t("checkAvailability")}
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackApartmentEvent("click_whatsapp", { source: "hub" })}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-brand-outline bg-brand-surface px-8 py-3 text-base font-semibold text-brand-primary shadow-sm transition-colors hover:bg-brand-surface/80 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-brand-primary focus-visible:focus:ring-offset-2"
              >
                {t("streetLevelArrival.whatsappCta")}
              </a>
            </div>
          </Section>

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
