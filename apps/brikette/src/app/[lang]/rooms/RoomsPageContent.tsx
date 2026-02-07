"use client";

// src/app/[lang]/rooms/RoomsPageContent.tsx
// Client component for rooms listing page
import { Fragment, memo } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";
import { RatingsBar } from "@acme/ui/atoms";
import { DirectBookingPerks } from "@acme/ui/molecules";
import RoomsSection from "@acme/ui/organisms/RoomsSection";

import AlsoHelpful from "@/components/common/AlsoHelpful";
import RoomsStructuredData from "@/components/seo/RoomsStructuredData";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";

type Props = {
  lang: AppLanguage;
};

function RoomsPageContent({ lang }: Props) {
  const { t } = useTranslation("roomsPage", { lng: lang, useSuspense: true });
  useTranslation("ratingsBar", { lng: lang, useSuspense: true });
  usePagePreload({
    lang,
    namespaces: ["roomsPage", "assistanceCommon"],
    optionalNamespaces: ["ratingsBar", "modals", "guides"],
  });

  const pageTitle = t("hero.heading", { defaultValue: "Our rooms" }) as string;
  const pageSubtitle = t("hero.subheading", { defaultValue: "" }) as string;

  return (
    <Fragment>
      <RoomsStructuredData />

      {/* Ratings Bar */}
      <RatingsBar className="my-6" lang={lang} />

      {/* Page Header */}
      <Section padding="default" className="text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-brand-heading sm:text-4xl lg:text-5xl">
          {pageTitle}
        </h1>
        {pageSubtitle && (
          <p className="mx-auto max-w-2xl text-lg text-brand-text/80">{pageSubtitle}</p>
        )}
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
