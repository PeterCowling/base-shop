import RoomsSectionBase from "@acme/ui/organisms/RoomsSection";

export type RoomsSectionBookingQuery = {
  checkIn?: string;
  checkOut?: string;
  pax?: string;
  queryString?: string;
};

type RoomsSectionProps = {
  lang?: string;
  bookingQuery?: RoomsSectionBookingQuery;
};

export function RoomsSection(props: RoomsSectionProps) {
  return <RoomsSectionBase {...(props as unknown as Record<string, unknown>)} />;
}

export default RoomsSection;
