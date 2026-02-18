import type { ComponentProps } from "react";

import RoomsSectionBase from "@acme/ui/organisms/RoomsSection";

import { BOOKING_CODE } from "@/context/modal/constants";
import { roomsData } from "@/data/roomsData";
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
};

type RoomsSectionBaseProps = ComponentProps<typeof RoomsSectionBase>;

export function RoomsSection({
  queryState,
  deal,
  ...props
}: RoomsSectionProps & Omit<RoomsSectionBaseProps, "itemListId" | "onRoomSelect">) {
  // Closure-level guard — prevents double-click / multi-tap from firing duplicate
  // GA4 events. Resets on each render (safe: navigation triggers page unload
  // before any subsequent render can occur).
  let isNavigating = false;

  const onRoomSelect = (ctx: { roomSku: string; plan: RatePlan; index: number }): void => {
    // Double-click / multi-tap deduplication guard (TC-05)
    if (isNavigating) return;

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
          isNavigating = true;
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
    />
  );
}

export default RoomsSection;
