"use client";

// src/app/[lang]/dorms/[id]/RoomDetailContent.tsx
// Client component for room detail page (uses useTranslation hooks)
import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import type { TFunction } from "i18next";

import StickyBookNow, { type StickyBookNowClickContext } from "@acme/ui/organisms/StickyBookNow";

import SocialProofSection from "@/components/landing/SocialProofSection";
import {
  BookingPickerSection,
  RoomDetailBookingNotices,
  RoomDetailRecoverySection,
} from "@/components/rooms/detail/RoomDetailBookingSections";
import {
  AmenitiesSection,
  coerceToContent,
  FeatureSection,
  type HeroContent,
  HeroSection,
  type OutlineContent,
  OutlineSection,
  resolveAmenitiesSection,
  resolveCopy,
  RoomDetailDescription,
  RoomDetailGuidesSection,
} from "@/components/rooms/detail/RoomDetailSections";
import RoomCard from "@/components/rooms/RoomCard";
import RoomStructuredData from "@/components/seo/RoomStructuredData";
import { BOOKING_CODE } from "@/context/modal/constants";
import roomsData, { type RoomId } from "@/data/roomsData";
import { usePagePreload } from "@/hooks/usePagePreload";
import { useRoomDetailBookingState } from "@/hooks/useRoomDetailBookingState";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { buildOctorateUrl } from "@/utils/buildOctorateUrl";
import { createBrikClickId, fireViewItem } from "@/utils/ga4-events";
import { trackThenNavigate } from "@/utils/trackThenNavigate";

type Props = {
  lang: AppLanguage;
  id: RoomId;
};

export { FeatureSection };

export default function RoomDetailContent({ lang, id }: Props) {
  const router = useRouter();
  const { t } = useTranslation("roomsPage", { lng: lang, useSuspense: true });
  const { t: tGuides } = useTranslation("guides", { lng: lang, useSuspense: true });
  const guidesEnT = i18n.getFixedT("en", "guides") as TFunction;
  const { t: tRoomsPageDetail } = useTranslation("pages.rooms", { lng: lang, useSuspense: true });
  const { t: tRoomDetail } = useTranslation("rooms", { lng: lang, useSuspense: true });
  usePagePreload({
    lang,
    namespaces: ["roomsPage", "guides", "pages.rooms", "rooms"],
    optionalNamespaces: ["assistanceCommon", "modals", "ratingsBar"],
  });
  const searchParams = useSearchParams();
  const room = roomsData.find((r) => r.id === id)!;
  const {
    range,
    queryState,
    pickerAdults,
    maxPickerAdults,
    pickerCheckIn,
    pickerCheckOut,
    indicativeAnchor,
    availabilityRoom,
    showRebuildQuotePrompt,
    handleRangeChange,
    handleAdultsChange,
  } = useRoomDetailBookingState(searchParams, router.replace, room, id);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const roomTitleKey = `rooms.${id}.title`;
  const bedDescriptionKey = `rooms.${id}.bed_description`;

  const title = resolveCopy(t(roomTitleKey), roomTitleKey, id.replace(/_/gu, " "));

  const hero = coerceToContent<HeroContent>(tRoomsPageDetail(`detail.${id}.hero`, { returnObjects: true }));
  const outline = coerceToContent<OutlineContent>(tRoomsPageDetail(`detail.${id}.outline`, { returnObjects: true }));

  const amenitiesHeading = resolveCopy(
    tRoomDetail("detail.common.amenitiesHeading"),
    "detail.common.amenitiesHeading",
  );
  const amenitiesIntro = resolveCopy(
    tRoomDetail("detail.common.amenitiesIntro"),
    "detail.common.amenitiesIntro",
  );
  const { blurbs: amenityBlurbs, shouldRender: shouldRenderAmenities } = resolveAmenitiesSection(
    tRoomDetail(`detail.${id}.amenities`, { returnObjects: true }),
    amenitiesHeading,
    amenitiesIntro,
  );

  const onStickyCheckoutClick = useCallback(
    (ctx: StickyBookNowClickContext) => {
      trackThenNavigate(
        "handoff_to_engine",
        {
          handoff_mode: "same_tab",
          engine_endpoint: "result",
          checkin: ctx.checkin,
          checkout: ctx.checkout,
          pax: ctx.pax,
          rate_plan: "nr",
          room_id: room.sku,
          source_route: `/${lang}/dorms/${id}`,
          cta_location: "room_detail_sticky_cta",
          brik_click_id: createBrikClickId(),
        },
        ctx.proceed,
      );
    },
    [id, lang, room.sku],
  );
  const stickyOctorateUrlResult = useMemo(
    () =>
      buildOctorateUrl({
        checkin: pickerCheckIn,
        checkout: pickerCheckOut,
        pax: pickerAdults,
        plan: "nr",
        roomSku: room.sku,
        octorateRateCode: room.rateCodes.direct.nr,
        bookingCode: BOOKING_CODE,
      }),
    [pickerCheckIn, pickerCheckOut, pickerAdults, room.sku, room.rateCodes.direct.nr],
  );
  const stickyOctorateUrl = stickyOctorateUrlResult.ok ? stickyOctorateUrlResult.url : undefined;

  // Fire view_item once per navigation
  useEffect(() => {
    fireViewItem({ itemId: room.sku, itemName: title });
  }, [room.sku, title]);

  return (
    <Fragment>
      <RoomStructuredData room={room} lang={lang} />
      <h1 className="mx-auto mt-6 px-4 text-3xl font-extrabold text-brand-primary dark:text-brand-secondary">
        {title}
      </h1>

      <HeroSection hero={hero} />

      <SocialProofSection lang={lang} />

      <BookingPickerSection
        datePickerRef={datePickerRef}
        range={range}
        onRangeChange={handleRangeChange}
        stayHelperText={t("date.stayHelper") as string}
        clearDatesText={t("date.clearDates") as string}
        checkInLabelText={t("booking.checkInLabel", { defaultValue: "Check in" }) as string}
        checkOutLabelText={t("booking.checkOutLabel", { defaultValue: "Check out" }) as string}
        adultsLabel={t("adults") as string}
        pickerAdults={pickerAdults}
        maxPickerAdults={maxPickerAdults}
        onAdultsChange={handleAdultsChange}
      />
      <RoomDetailBookingNotices
        queryState={queryState}
        indicativeAnchor={indicativeAnchor}
        showRebuildQuotePrompt={showRebuildQuotePrompt}
      />

      <RoomCard
        room={room}
        checkIn={pickerCheckIn}
        checkOut={pickerCheckOut}
        adults={pickerAdults}
        lang={lang}
        queryState={queryState}
        datePickerRef={datePickerRef}
        availabilityRoom={availabilityRoom}
      />

      <RoomDetailRecoverySection
        lang={lang}
        roomId={id}
        roomSku={room.sku}
        queryState={queryState}
        checkin={pickerCheckIn}
        checkout={pickerCheckOut}
        pax={pickerAdults}
      />

      <RoomDetailDescription
        description={resolveCopy(t(bedDescriptionKey), bedDescriptionKey)}
        lang={lang}
      />

      <FeatureSection
        features={room.features}
        bedsLabel={t("feature.beds") as string}
        bathroomLabel={t("feature.bathroom") as string}
        viewLabel={t("feature.view") as string}
        terraceLabel={t("feature.terrace") as string}
        lockersLabel={t("feature.lockers") as string}
        privateTerraceLabel={t("feature.privateTerrace") as string}
        inRoomLockersLabel={t("feature.inRoomLockers") as string}
      />
      <OutlineSection outline={outline} />

      <AmenitiesSection
        shouldRender={shouldRenderAmenities}
        heading={amenitiesHeading}
        intro={amenitiesIntro}
        blurbs={amenityBlurbs}
      />

      <RoomDetailGuidesSection lang={lang} tGuides={tGuides} guidesEnT={guidesEnT} />

      {/* Spacer so the sticky CTA doesn't cover footer content on small screens */}
      <div className="h-20 sm:hidden" aria-hidden />
      <StickyBookNow
        lang={lang}
        onStickyCheckoutClick={onStickyCheckoutClick}
        octorateUrl={stickyOctorateUrl}
      />
    </Fragment>
  );
}
