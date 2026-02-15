import type { ComponentProps } from "react";

import RoomsSectionBase from "@acme/ui/organisms/RoomsSection";

import { fireSelectItem, type ItemListId, type RatePlan } from "@/utils/ga4-events";

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
};

type RoomsSectionBaseProps = ComponentProps<typeof RoomsSectionBase>;

export function RoomsSection(props: RoomsSectionProps & Omit<RoomsSectionBaseProps, "itemListId" | "onRoomSelect">) {
  const onRoomSelect = (ctx: { roomSku: string; plan: RatePlan; index: number }): void => {
    if (!props.itemListId) return;
    fireSelectItem({
      itemListId: props.itemListId,
      roomSku: ctx.roomSku,
      plan: ctx.plan,
      index: ctx.index,
    });
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
