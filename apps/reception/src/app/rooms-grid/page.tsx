// Keep this dynamic to avoid static caching of rapidly changing booking data.
import RoomsGridClient from "./RoomsGridClient";

export const dynamic = "force-dynamic";

export default function RoomsGridPage() {
  return <RoomsGridClient />;
}
