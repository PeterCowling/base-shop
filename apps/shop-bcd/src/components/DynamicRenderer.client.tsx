// apps/shop-bcd/src/components/DynamicRenderer.tsx

"use client";

import BlogListing from "@/components/cms/blocks/BlogListing";
import ContactForm from "@/components/cms/blocks/ContactForm";
import ContactFormWithMap from "@/components/cms/blocks/ContactFormWithMap";
import Gallery from "@/components/cms/blocks/Gallery";
import Testimonials from "@/components/cms/blocks/Testimonials";
import TestimonialSlider from "@/components/cms/blocks/TestimonialSlider";
import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { PRODUCTS } from "@/lib/products";
import type { PageComponent, SKU } from "@types";

const registry: Record<
  PageComponent["type"],
  React.ComponentType<Record<string, unknown>>
> = {
  HeroBanner,
  ValueProps,
  ReviewsCarousel,
  ProductGrid,
  Gallery,
  ContactForm,
  ContactFormWithMap,
  BlogListing,
  Testimonials,
  TestimonialSlider,
};

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
