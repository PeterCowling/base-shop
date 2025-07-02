// apps/shop-bcd/src/components/DynamicRenderer.tsx

"use client";

import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { PRODUCTS } from "@/lib/products";
import type { PageComponent, SKU } from "@types";

const registry: Record<
  PageComponent["type"],
  React.ComponentType<Record<string, unknown>>
> = { HeroBanner, ValueProps, ReviewsCarousel, ProductGrid };

export default function DynamicRenderer({
  components,
}: {
  components: PageComponent[];
}) {
  return (
    <>
      {components.map((c) => {
        const Comp = registry[c.type];
        if (!Comp) {
          console.warn(`Unknown component type: ${c.type}`);
          return null;
        }

        switch (c.type) {
          case "ProductGrid":
            return (
              <div key={c.id} style={{ width: c.width, height: c.height }}>
                <Comp skus={PRODUCTS as SKU[]} />
              </div>
            );
          default:
            return (
              <div key={c.id} style={{ width: c.width, height: c.height }}>
                <Comp />
              </div>
            );
        }
      })}
    </>
  );
}
