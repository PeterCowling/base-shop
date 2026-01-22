"use client";

import IngredientStock from "@/components/inventory/IngredientStock";
import Providers from "@/components/Providers";

export default function IngredientStockPage() {
  return (
    <Providers>
      <IngredientStock />
    </Providers>
  );
}
