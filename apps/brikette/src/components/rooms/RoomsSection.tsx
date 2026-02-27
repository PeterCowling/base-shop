import type { ComponentProps } from "react";
import { useEffect, useMemo, useRef } from "react";

import RoomsSectionBase from "@acme/ui/organisms/RoomsSection";
import type { RoomCardPrice } from "@acme/ui/types/roomCard";

import { BOOKING_CODE } from "@/context/modal/constants";
import { roomsData } from "@/data/roomsData";
import type { OctorateRoom } from "@/hooks/useAvailability";
import { buildOctorateUrl } from "@/utils/buildOctorateUrl";
import { buildRoomItem, fireSelectItem, type ItemListId, type RatePlan } from "@/utils/ga4-events";
import { trackThenNavigate } from "@/utils/trackThenNavigate";

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
};

type RoomsSectionBaseProps = ComponentProps<typeof RoomsSectionBase>;

export function RoomsSection({
  queryState,
  deal,
  availabilityRooms,
  ...props
}: RoomsSectionProps & Omit<RoomsSectionBaseProps, "itemListId" | "onRoomSelect">) {
  // Map availabilityRooms (keyed by octorateRoomName) to roomPrices (keyed by room.id).
  // Consumers match via room.widgetRoomCode === availabilityRoom.octorateRoomName.
  const roomPrices = useMemo<Record<string, RoomCardPrice> | undefined>(() => {
    if (!availabilityRooms || availabilityRooms.length === 0) return undefined;
    const prices: Record<string, RoomCardPrice> = {};
    for (const avRoom of availabilityRooms) {
      const match = roomsData.find((r) => r.widgetRoomCode === avRoom.octorateRoomName);
      if (!match) continue;
      if (!avRoom.available) {
        prices[match.id] = { soldOut: true };
      } else if (avRoom.priceFrom !== null) {
        // Format as "From €XX.XX" — consumers can override with t("ratesFrom") if needed.
        // Use raw number; the UI RoomCard accepts pre-formatted string in price.formatted.
        prices[match.id] = {
          formatted: `From €${avRoom.priceFrom.toFixed(2)}`,
          soldOut: false,
        };
      }
    }
    return Object.keys(prices).length > 0 ? prices : undefined;
  }, [availabilityRooms]);

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

    if (typeof window === "undefined") return;

    if (queryState === "valid") {
      // Navigate directly to Octorate using the booking query dates.
      // TC-02/TC-03/TC-04: wrap in trackThenNavigate for reliable beacon dispatch.
      const room = roomsData.find((r) => r.id === ctx.roomSku);
      if (room) {
        const octorateRateCode =
          ctx.plan === "nr" ? room.rateCodes.direct.nr : room.rateCodes.direct.flex;
        const checkin = props.bookingQuery?.checkIn ?? "";
        const checkout = props.bookingQuery?.checkOut ?? "";
        const pax = parseInt(props.bookingQuery?.pax ?? "1", 10) || 1;
        const result = buildOctorateUrl({
          checkin,
          checkout,
          pax,
          plan: ctx.plan,
          roomSku: ctx.roomSku,
          octorateRateCode,
          bookingCode: BOOKING_CODE,
          ...(deal ? { deal } : {}),
        });
        if (result.ok) {
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
          trackThenNavigate(
            "begin_checkout",
            {
              source: "room_card",
              checkin,
              checkout,
              pax,
              ...(props.itemListId ? { item_list_id: props.itemListId } : null),
              items: [buildRoomItem({ roomSku: ctx.roomSku, plan: ctx.plan })],
            },
            // TC-03: navigation via window.location.assign inside navigate callback.
            () => window.location.assign(result.url),
          );
          return;
        }
      }
    }

    if (queryState !== "invalid") {
      const lang = props.lang ?? "en";
      window.location.href = `/${lang}/book`;
    }
  };

  return (
    <RoomsSectionBase
      {...props}
      itemListId={props.itemListId}
      onRoomSelect={onRoomSelect}
      {...(roomPrices ? { roomPrices } : {})}
    />
  );
}

export default RoomsSection;
