"use client";

// src/app/[lang]/rooms/RoomsPageContent.tsx
// Client component for rooms listing page
import { Fragment, memo, useEffect } from "react";
import { useTranslation } from "react-i18next";

import RatingsBar from "@acme/ui/atoms/RatingsBar";
import { Section } from "@acme/ui/atoms/Section";
import { DirectBookingPerks } from "@acme/ui/molecules/DirectBookingPerks";
import RoomsSection from "@acme/ui/organisms/RoomsSection";

import AlsoHelpful from "@/components/common/AlsoHelpful";
import RoomsStructuredData from "@/components/seo/RoomsStructuredData";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { preloadI18nNamespaces,preloadNamespacesWithFallback } from "@/utils/loadI18nNs";

type Props = {
  lang: AppLanguage;
};

function RoomsPageContent({ lang }: Props) {
  const { t } = useTranslation("roomsPage", { lng: lang, useSuspense: true });
  useTranslation("ratingsBar", { lng: lang, useSuspense: true });

  // Preload namespaces
  useEffect(() => {
    const loadNamespaces = async () => {
      await preloadNamespacesWithFallback(lang, ["roomsPage", "assistanceCommon"]);
      await preloadI18nNamespaces(lang, ["ratingsBar", "modals", "guides"], {
        optional: true,
      });
      await i18n.changeLanguage(lang);
    };
    void loadNamespaces();
  }, [lang]);

  const pageTitle = (t("title") as string) || "Rooms";
  const pageSubtitle = (t("subtitle") as string) || "";

  return (
    <Fragment>
      <RoomsStructuredData />

      {/* Page Header */}
      <Section padding="default" className="text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-brand-heading sm:text-4xl lg:text-5xl">
          {pageTitle}
        </h1>
        {pageSubtitle && (
          <p className="mx-auto max-w-2xl text-lg text-brand-text/80">{pageSubtitle}</p>
        )}
      </Section>

      {/* Ratings Bar */}
      <Section padding="narrow">
        <RatingsBar />
      </Section>

      {/* Rooms Grid */}
      <RoomsSection lang={lang} />

      {/* Direct Booking Perks */}
      <Section padding="default">
        <DirectBookingPerks lang={lang} />
      </Section>

      {/* Also Helpful */}
      <Section padding="default">
        <AlsoHelpful
          lang={lang}
          tags={["accommodation", "budget"]}
          section="experiences"
        />
      </Section>
    </Fragment>
  );
}

export default memo(RoomsPageContent);
