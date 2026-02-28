import Providers from "@/components/ClientProviders";
import IngredientStock from "@/components/inventory/IngredientStock";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function IngredientStockPage() {
  return (
    <Providers>
      <IngredientStock />
    </Providers>
  );
}
