import type { ComponentProps } from "react";
import { useEffect, useMemo, useRef } from "react";

import RoomsSectionBase from "@acme/ui/organisms/RoomsSection";
import type { RoomCardPrice } from "@acme/ui/types/roomCard";

import { BOOKING_CODE } from "@/context/modal/constants";
import { roomsData, websiteVisibleRoomsData } from "@/data/roomsData";
import type { OctorateRoom } from "@/hooks/useAvailability";
import type { AppLanguage } from "@/i18n.config";
import { aggregateAvailabilityByCategory } from "@/utils/aggregateAvailabilityByCategory";
import { buildOctorateUrl } from "@/utils/buildOctorateUrl";
import { readAttribution } from "@/utils/entryAttribution";
import { createBrikClickId, fireSelectItem, type ItemListId, type RatePlan } from "@/utils/ga4-events";
import { trackThenNavigate } from "@/utils/trackThenNavigate";
import { translatePath } from "@/utils/translate-path";

const visibleRoomsData =
  Array.isArray(websiteVisibleRoomsData) && websiteVisibleRoomsData.length > 0
    ? websiteVisibleRoomsData
    : roomsData;

export type RoomsSectionBookingQuery = {
  checkIn?: string;
  checkOut?: string;
  pax?: string;
  queryString?: string;
};

type RoomsSectionProps = {
  lang?: string;
  bookingQuery?: RoomsSectionBookingQuery;
  itemListId?: ItemListId;
  /**
   * Controls CTA navigation behavior for room card actions.
   * - "valid": navigate directly to Octorate booking URL (dates are set and valid)
   * - "invalid": actions are disabled (no navigation)
   * - "absent" (default): navigate to /{lang}/book
   */
  queryState?: "valid" | "invalid" | "absent";
  /** Optional deal / coupon code to propagate into Octorate booking URL */
  deal?: string;
  /**
   * Live availability data from /api/availability.
   * Mapped to per-room pricing via widgetRoomCode → room ID lookup.
   * When present overrides the static basePrice display for each room.
   */
  availabilityRooms?: OctorateRoom[];
  /** Optional override for room-card pricing when live availability is absent. */
  roomPricesOverride?: Record<string, RoomCardPrice>;
  /** Optional allow-list of room IDs to render in the section. */
  includeRoomIds?: string[];
  /**
   * Optional callback fired when a room CTA is clicked without a complete
   * booking query (queryState === "absent"). Allows the page to guide users
   * to the booking search UI instead of navigating away.
   */
  onRequireSearchInput?: () => void;
};

type RoomsSectionBaseProps = ComponentProps<typeof RoomsSectionBase>;

export function RoomsSection({
  queryState,
  deal,
  availabilityRooms,
  roomPricesOverride,
  includeRoomIds,
  ...props
}: RoomsSectionProps & Omit<RoomsSectionBaseProps, "itemListId" | "onRoomSelect">) {
  const effectiveExcludeRoomIds = useMemo(() => {
    const includedSet = includeRoomIds ? new Set(includeRoomIds) : null;
    const derived: string[] = [];
    for (const room of roomsData) {
      if (room.isVisibleOnWebsite === false) derived.push(room.id);
      else if (includedSet && !includedSet.has(room.id)) derived.push(room.id);
    }
    return Array.from(new Set([...(props.excludeRoomIds ?? []), ...derived]));
  }, [includeRoomIds, props.excludeRoomIds]);

  // Map availabilityRooms to roomPrices (keyed by room.id) via name-based category matching.
  // Each room's octorateRoomCategory is matched against octorateRoomName in aggregated sections.
  const roomPrices = useMemo<Record<string, RoomCardPrice> | undefined>(() => {
    if (!availabilityRooms || availabilityRooms.length === 0) return roomPricesOverride;
    const prices: Record<string, RoomCardPrice> = { ...(roomPricesOverride ?? {}) };
    for (const room of visibleRoomsData) {
      if (!room.octorateRoomCategory) continue;
      const avRoom = aggregateAvailabilityByCategory(availabilityRooms, room.octorateRoomCategory);
      if (!avRoom) continue;
      if (!avRoom.available) {
        prices[room.id] = { soldOut: true };
      } else if (avRoom.priceFrom !== null) {
        // Format as "From €XX.XX" — consumers can override with t("ratesFrom") if needed.
        // Use raw number; the UI RoomCard accepts pre-formatted string in price.formatted.
        prices[room.id] = {
          formatted: `From €${avRoom.priceFrom.toFixed(2)}`,
          soldOut: false,
        };
      }
    }
    return Object.keys(prices).length > 0 ? prices : undefined;
  }, [availabilityRooms, roomPricesOverride, visibleRoomsData]);

  // Ref-level guard prevents duplicate begin_checkout events on rapid re-clicks.
  // It must be reset on `pageshow` because back/forward cache can restore a page
  // with prior JS state after navigation away.
  const isNavigatingRef = useRef(false);
  const unlockTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const resetGuard = () => {
      isNavigatingRef.current = false;
      if (unlockTimerRef.current !== null) {
        window.clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = null;
      }
    };

    window.addEventListener("pageshow", resetGuard);

    return () => {
      window.removeEventListener("pageshow", resetGuard);
      resetGuard();
    };
  }, []);

  const resolveValidBookingUrl = (ctx: { roomSku: string; plan: RatePlan }): string | null => {
    const room = visibleRoomsData.find((r) => r.id === ctx.roomSku);
    if (!room) return null;
    const result = buildOctorateUrl({
      checkin: props.bookingQuery?.checkIn ?? "",
      checkout: props.bookingQuery?.checkOut ?? "",
      pax: parseInt(props.bookingQuery?.pax ?? "1", 10) || 1,
      plan: ctx.plan,
      roomSku: ctx.roomSku,
      octorateRateCode: ctx.plan === "nr" ? room.rateCodes.direct.nr : room.rateCodes.direct.flex,
      bookingCode: BOOKING_CODE,
      ...(deal ? { deal } : {}),
    });
    return result.ok ? result.url : null;
  };

  const startTrackedCheckoutNavigation = (ctx: {
    roomSku: string;
    plan: RatePlan;
    targetUrl: string;
  }): void => {
    const checkin = props.bookingQuery?.checkIn ?? "";
    const checkout = props.bookingQuery?.checkOut ?? "";
    const pax = parseInt(props.bookingQuery?.pax ?? "1", 10) || 1;
    // Set guard before async beacon dispatch to block re-entrant calls.
    isNavigatingRef.current = true;
    // Auto-release guard if navigation is blocked/canceled and no unload occurs.
    if (unlockTimerRef.current !== null) {
      window.clearTimeout(unlockTimerRef.current);
    }
    unlockTimerRef.current = window.setTimeout(() => {
      isNavigatingRef.current = false;
      unlockTimerRef.current = null;
    }, 2000);
    // Read attribution carrier written at entry CTA click.
    const attribution = readAttribution();
    const attributionFields: Record<string, unknown> = attribution
      ? {
          entry_source_surface: attribution.source_surface,
          entry_source_cta: attribution.source_cta,
          entry_resolved_intent: attribution.resolved_intent,
          ...(attribution.product_type !== null ? { entry_product_type: attribution.product_type } : {}),
          entry_decision_mode: attribution.decision_mode,
          entry_destination_funnel: attribution.destination_funnel,
          entry_locale: attribution.locale,
          entry_fallback_triggered: attribution.fallback_triggered,
        }
      : {};
    trackThenNavigate(
      "begin_checkout",
      {
        handoff_mode: "same_tab",
        engine_endpoint: "result",
        checkin,
        checkout,
        pax,
        rate_plan: ctx.plan,
        room_id: ctx.roomSku,
        source_route: `/${props.lang ?? "en"}/dorms`,
        cta_location: "rooms_section_rate_cta",
        brik_click_id: createBrikClickId(),
        ...attributionFields,
      },
      () => window.location.assign(ctx.targetUrl),
    );
  };

  const onRoomSelect = (ctx: { roomSku: string; plan: RatePlan; index: number }): void => {
    // Double-click / multi-tap deduplication guard (TC-05)
    if (isNavigatingRef.current) return;

    // TC-01: fire select_item fire-and-forget with full GA4 item fields.
    // buildRoomItem now includes item_category, affiliation, currency via TASK-31.
    if (props.itemListId) {
      fireSelectItem({
        itemListId: props.itemListId,
        roomSku: ctx.roomSku,
        plan: ctx.plan,
        index: ctx.index,
      });
    }

    if (queryState === "valid") {
      const targetUrl = resolveValidBookingUrl(ctx);
      if (targetUrl) {
        // Navigate directly to Octorate using the booking query dates.
        // TC-02/TC-03/TC-04: wrap in trackThenNavigate for reliable beacon dispatch.
        startTrackedCheckoutNavigation({ roomSku: ctx.roomSku, plan: ctx.plan, targetUrl });
        return;
      }
    }

    if (queryState === "absent" && props.onRequireSearchInput) {
      props.onRequireSearchInput();
      return;
    }

    if (queryState !== "invalid") {
      const lang = (props.lang ?? "en") as AppLanguage;
      window.location.href = `/${lang}/${translatePath("book", lang)}`;
    }
  };

  return (
    <RoomsSectionBase
      {...props}
      excludeRoomIds={effectiveExcludeRoomIds}
      singleCtaMode
      itemListId={props.itemListId}
      onRoomSelect={onRoomSelect}
      {...(roomPrices ? { roomPrices } : {})}
    />
  );
}

export default RoomsSection;
