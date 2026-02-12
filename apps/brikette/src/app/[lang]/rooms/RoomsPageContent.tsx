"use client";

// src/app/[lang]/rooms/RoomsPageContent.tsx
// Client component for rooms listing page
import { Fragment, memo } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";
import { DirectBookingPerks } from "@acme/ui/molecules";

import AlsoHelpful from "@/components/common/AlsoHelpful";
import RoomsSection, { type RoomsSectionBookingQuery } from "@/components/rooms/RoomsSection";
import RoomsStructuredData from "@/components/seo/RoomsStructuredData";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";

type Props = {
  lang: AppLanguage;
  bookingQuery?: RoomsSectionBookingQuery;
};

const I18N_KEY_TOKEN_PATTERN = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;

function resolveTranslatedCopy(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (I18N_KEY_TOKEN_PATTERN.test(trimmed)) return fallback;
  return trimmed;
}

function RoomsPageContent({ lang, bookingQuery }: Props) {
  const { t } = useTranslation("roomsPage", { lng: lang, useSuspense: true });
  useTranslation("ratingsBar", { lng: lang, useSuspense: true });
  usePagePreload({
    lang,
    namespaces: ["roomsPage", "assistanceCommon"],
    optionalNamespaces: ["ratingsBar", "modals", "guides"],
  });

  const pageTitle = resolveTranslatedCopy(
    t("hero.heading", { defaultValue: "Our rooms" }),
    "Our rooms"
  );
  const pageSubtitle = resolveTranslatedCopy(
    t("hero.subheading", { defaultValue: "" }),
    ""
  );

  return (
    <Fragment>
      <RoomsStructuredData />

      {/* Page Header */}
      <Section padding="default" className="text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-brand-heading sm:text-4xl lg:text-5xl">
          {pageTitle}
        </h1>
        {pageSubtitle && (
          <p className="mx-auto text-lg text-brand-text/80">{pageSubtitle}</p>
        )}
      </Section>

      {/* Rooms Grid */}
      <RoomsSection lang={lang} bookingQuery={bookingQuery} />

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
