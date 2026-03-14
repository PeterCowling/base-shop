import Providers from "@/components/ClientProviders";
import StockHub from "@/components/stock/StockHub";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function StockPage() {
  return (
    <Providers>
      <StockHub />
    </Providers>
  );
}