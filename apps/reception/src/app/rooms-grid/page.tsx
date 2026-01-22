// Skip SSG - @daminort/reservation-grid has React internals incompatible with prerendering
import RoomsGridClient from "./RoomsGridClient";

export const dynamic = "force-dynamic";

export default function RoomsGridPage() {
  return <RoomsGridClient />;
}
