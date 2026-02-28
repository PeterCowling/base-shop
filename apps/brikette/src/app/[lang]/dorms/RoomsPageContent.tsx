"use client";

// src/app/[lang]/dorms/RoomsPageContent.tsx
// Client component for rooms listing page
import { Fragment, memo, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";
import { DirectBookingPerks } from "@acme/ui/molecules";

import RoomsSection, { type RoomsSectionBookingQuery } from "@/components/rooms/RoomsSection";
import { roomsData } from "@/data/roomsData";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { fireViewItemList } from "@/utils/ga4-events";

type Props = {
  lang: AppLanguage;
  bookingQuery?: RoomsSectionBookingQuery;
  /** Server-resolved hero heading from the RSC page wrapper; used as SSR-stable primary value. */
  serverTitle?: string;
  /** Server-resolved hero subheading from the RSC page wrapper. */
  serverSubtitle?: string;
};

const I18N_KEY_TOKEN_PATTERN = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;

function resolveTranslatedCopy(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (I18N_KEY_TOKEN_PATTERN.test(trimmed)) return fallback;
  return trimmed;
}

function RoomsPageContent({ lang, bookingQuery, serverTitle, serverSubtitle }: Props) {
  const { t } = useTranslation("roomsPage", { lng: lang, useSuspense: true });
  useTranslation("ratingsBar", { lng: lang, useSuspense: true });
  usePagePreload({
    lang,
    namespaces: ["roomsPage", "assistanceCommon"],
    optionalNamespaces: ["ratingsBar", "modals", "guides"],
  });

  // Use server-resolved props when available (guaranteed SSR content from RSC wrapper).
  // Fall back to client-side translation if server props are absent (e.g. in tests).
  const pageTitle =
    serverTitle ??
    resolveTranslatedCopy(t("hero.heading", { defaultValue: "Our rooms" }), "Our rooms");
  const pageSubtitle =
    serverSubtitle ??
    resolveTranslatedCopy(t("hero.subheading", { defaultValue: "" }), "");

  useEffect(() => {
    fireViewItemList({
      itemListId: "rooms_index",
      rooms: roomsData,
    });
  }, []);

  return (
    <Fragment>
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
      <RoomsSection lang={lang} bookingQuery={bookingQuery} itemListId="rooms_index" excludeRoomIds={["double_room"]} />

      {/* Direct Booking Perks */}
      <Section padding="default">
        <DirectBookingPerks lang={lang} />
      </Section>

    </Fragment>
  );
}

export default memo(RoomsPageContent);
