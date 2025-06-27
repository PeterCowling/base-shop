"use client";

import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { ProductGrid } from "@/components/shop/ProductGrid";
import type { PageComponent } from "@types";

const registry = {
  HeroBanner,
  ValueProps,
  ReviewsCarousel,
  ProductGrid,
} as const satisfies Record<PageComponent["type"], React.ComponentType<any>>;

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
        return <Comp key={c.id} />;
      })}
    </>
  );
}
