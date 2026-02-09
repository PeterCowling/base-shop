import Providers from "@/components/Providers";
import BookingSearch from "@/components/search/Search";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function AuditPage() {
  return (
    <Providers>
      <BookingSearch />
    </Providers>
  );
}
