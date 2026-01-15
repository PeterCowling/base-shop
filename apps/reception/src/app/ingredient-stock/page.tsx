"use client";

import Providers from "@/components/Providers";
import IngredientStock from "@/components/inventory/IngredientStock";

export default function IngredientStockPage() {
  return (
    <Providers>
      <IngredientStock />
    </Providers>
  );
}
