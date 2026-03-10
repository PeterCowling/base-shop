import Providers from "@/components/ClientProviders";
import Stock from "@/components/man/Stock";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function StockPage() {
  return (
    <Providers>
      <Stock />
    </Providers>
  );
}