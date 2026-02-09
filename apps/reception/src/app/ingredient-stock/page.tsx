import IngredientStock from "@/components/inventory/IngredientStock";
import Providers from "@/components/Providers";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function IngredientStockPage() {
  return (
    <Providers>
      <IngredientStock />
    </Providers>
  );
}
