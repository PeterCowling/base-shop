// Skip SSG - @daminort/reservation-grid has React internals incompatible with prerendering
export const dynamic = "force-dynamic";

import RoomsGridClient from "./RoomsGridClient";

export default function RoomsGridPage() {
  return <RoomsGridClient />;
}
