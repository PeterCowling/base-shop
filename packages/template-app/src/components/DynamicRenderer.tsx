// packages/template-app/src/components/DynamicRenderer.tsx

("use client");

import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { PRODUCTS } from "@/lib/products";
import type { PageComponent, SKU } from "@types";

export { default as BlogListing } from "./BlogListing";
export { default as ContactForm } from "./ContactForm";
export { default as ContactFormWithMap } from "./ContactFormWithMap";
export { default as Gallery } from "./Gallery";
export { default as Image } from "./Image";
export { default as Testimonials } from "./Testimonials";
export { default as TestimonialSlider } from "./TestimonialSlider";
export { default as Text } from "./Text";

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
            return <Comp key={c.id} skus={PRODUCTS as SKU[]} />;
          default:
            return <Comp key={c.id} />;
        }
      })}
    </>
  );
}
